import { PlatformType, Options, ImagePaths } from "./type.js";
import { APP_TYPE } from "./config.js";
import {
  IsSameDimension,
  captureScreenshot,
  compareIMG,
  createDirectoryFromPlatform,
  decodePNGFromPath,
  determinePlatform,
  diffPNG,
  getIMGMetadata,
  getPath,
  handleFailedComparison,
  handleMismatch,
  resizeIMG,
} from "./Utils.js";
import { PNGWithMetadata } from "pngjs";
import sharp from "sharp";

const compareScreenshots = async ({ selector, filename, frame }: Options) => {
  const platform: PlatformType = determinePlatform(APP_TYPE);
  createDirectoryFromPlatform(platform);

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

  await captureScreenshot({ selector, filename: paths.current, frame });

  let baselineIMGDimension: sharp.Metadata = await getIMGMetadata(
    paths.baseline
  );
  let currentIMGDimension: sharp.Metadata = await getIMGMetadata(paths.current);

  console.log(currentIMGDimension);

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

  console.log(currentIMGDimension);
  console.log(baselineIMGDimension);

  const baselinePNG: PNGWithMetadata = decodePNGFromPath(paths.baseline);
  const currentPNG: PNGWithMetadata = decodePNGFromPath(paths.current);

  if (!baselinePNG || !currentPNG) {
    return handleFailedComparison({
      failFolder: paths.current,
      platform,
      filename,
    });
  }

  const numdiff = compareIMG({
    img1: baselinePNG,
    img2: currentPNG,
  });

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
