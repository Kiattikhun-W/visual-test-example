import { PlatformType, Options, ImagePaths } from "./type.js";
import { APP_TYPE } from "./config.js";
import {
  IsSameDimension,
  captureScreenshot,
  compareIMG,
  createDirectoryFromPath,
  createDirectoryFromPlatform,
  decodePNGFromPath,
  determinePlatform,
  getIMGMetadata,
  getPath,
  handleFailedComparison,
  handleMismatch,
  resizeIMG,
} from "./Utils.js";
import { PNG, PNGWithMetadata } from "pngjs";
import sharp from "sharp";

export const compareScreenshots = async (
  { selector, filename, frame }: Options,
  browser: WebdriverIO.Browser
) => {
  const platform: PlatformType = determinePlatform(APP_TYPE);

  console.log("Plantfom 💜", platform);
  // createDirectoryFromPlatform(platform);

  const paths: ImagePaths = {
    baseline: getPath(
      { filename, apptype: APP_TYPE, platform },
      { isBaseline: true }
    ),
    current: getPath(
      { filename, apptype: APP_TYPE, platform },
      { isCompare: true }
    ),
    diff: getPath({ filename, apptype: APP_TYPE, platform }, { isDiff: true }),
  };
  for (const path of Object.values(paths)) {
    createDirectoryFromPath(path);
  }
  await captureScreenshot(
    { selector, filename: paths.current, frame },
    browser
  );

  let baselineIMGDimension: sharp.Metadata = await getIMGMetadata(
    paths.baseline
  );
  let currentIMGDimension: sharp.Metadata = await getIMGMetadata(paths.current);

  const isSameIMGSize: boolean = IsSameDimension(
    baselineIMGDimension,
    currentIMGDimension
  );

  if (!isSameIMGSize) {
    await resizeIMG(paths.baseline);
    await resizeIMG(paths.current);
  }

  baselineIMGDimension = await getIMGMetadata(paths.baseline);
  currentIMGDimension = await getIMGMetadata(paths.current);

  const baselinePNG: PNGWithMetadata = decodePNGFromPath(paths.baseline);
  const currentPNG: PNGWithMetadata = decodePNGFromPath(paths.current);

  if (!baselinePNG || !currentPNG) {
    return handleFailedComparison({
      failFolder: paths.current,
      platform,
      filename,
    });
  }
  //result of pixelmatch
  const numdiff = compareIMG(paths.diff, {
    img1: baselinePNG,
    img2: currentPNG,
    width: baselinePNG.width as number,
    height: baselinePNG.height as number,
  });

  const diffPNG = new PNG({
    width: baselinePNG.width,
    height: baselinePNG.height,
  });

  console.log("outside", diffPNG.width, diffPNG.height, diffPNG.data);

  if (numdiff > 0) {
    const result = handleMismatch(paths, {
      baselinePNG,
      diffPNG,
      numdiff,
    });
    return result;
  }
  return {
    result: true,
    message: "Images are same",
  };
};
