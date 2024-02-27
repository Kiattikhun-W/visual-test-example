import {
  PlatformType,
  Options,
  ImagePaths,
  ImageComparisonResults,
} from "../types/type.js";
import { APP_TYPE } from "../config/config.js";
import {
  IsSameDimension,
  captureScreenshot,
  compareIMG,
  createDirectoryFromPath,
  decodePNGFromPath,
  determinePlatform,
  getIMGMetadata,
  getPath,
  handleFailedComparison,
  handleMismatch,
  resizeIMG,
} from "./Utils.js";
import { PNGWithMetadata } from "pngjs";
import sharp from "sharp";
import fs from "fs";

/**
 * Checks and compares screenshots for a given selector, filename, and frame.
 * @param options - The options for screenshot comparison.
 * @param browser - The WebdriverIO browser instance.
 * @returns An object containing the result and message of the comparison.
 */
export const checkScreenshots = async (
  { selector, filename, frame }: Options,
  browser: WebdriverIO.Browser
): Promise<ImageComparisonResults> => {
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

  if (!fs.existsSync(paths.baseline)) {
    await captureScreenshot(
      { selector, filename: paths.baseline, frame },
      browser
    );
  }

  await captureScreenshot(
    { selector, filename: paths.current, frame },
    browser
  );

  let baselineIMGDimension: sharp.Metadata | null = await getIMGMetadata(
    paths.baseline
  );
  let currentIMGDimension: sharp.Metadata | null = await getIMGMetadata(
    paths.current
  );

  if (!baselineIMGDimension || !currentIMGDimension) {
    // Handle the case when the metadata is null
    return handleFailedComparison({
      failFolder: paths.current,
      platform,
      filename,
    });
  }

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
  const { numDiffPixels, diffPNG } = compareIMG(paths.diff, {
    img1: baselinePNG,
    img2: currentPNG,
    width: baselinePNG.width as number,
    height: baselinePNG.height as number,
  });

  if (numDiffPixels > 0) {
    const result: ImageComparisonResults = handleMismatch(paths, {
      baselinePNG,
      diffPNG,
      numdiff: numDiffPixels,
    });
    return result;
  }
  console.info("Images are same");
  return {
    result: true,
    message: "Images are same",
    numDiffPixels,
  } as ImageComparisonResults;
};
