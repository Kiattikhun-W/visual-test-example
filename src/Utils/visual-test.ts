import {
  PlatformType,
  Options,
  ImagePaths,
  ImageComparisonResults,
} from "../types/type.js";
import { APP_TYPE, defaultCompareOptions } from "../config/config.js";
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
import { PixelmatchOptions } from "pixelmatch";

/**
 * Checks and compares screenshots using the specified options.
 *
 * @param {Options} options - The options for capturing and comparing screenshots.
 * @param {PixelmatchOptions} compareOptions - The options for pixel comparison (optional).
 * @param {sharp.ResizeOptions} resizeOptions - The options for resizing the screenshots (optional).
 * @returns {Promise<ImageComparisonResults>} A promise that resolves to the image comparison results.
 */
export const checkScreenshots = async (
  { selector, filename, frame }: Options,
  compareOptions: PixelmatchOptions = defaultCompareOptions,
  resizeOptions: sharp.ResizeOptions = { width: 1280, height: 1040 }
): // browser: WebdriverIO.Browser
Promise<ImageComparisonResults> => {
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
      { selector, filename: paths.baseline, frame }
      // browser
    );
  }

  await captureScreenshot(
    { selector, filename: paths.current, frame }
    // browser
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
    await resizeIMG(paths.baseline, resizeOptions);
    await resizeIMG(paths.current, resizeOptions);
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
  const { numDiffPixels, diffPNG } = compareIMG(
    paths.diff,
    {
      img1: baselinePNG,
      img2: currentPNG,
      width: baselinePNG.width as number,
      height: baselinePNG.height as number,
    },
    compareOptions
  );

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
