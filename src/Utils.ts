import path from "path";
import fs from "fs";
import sharp from "sharp";
import { PNG, PNGWithMetadata } from "pngjs";
import pixelmatch, { PixelmatchOptions } from "pixelmatch";
import appconfig from "../appconfig.json";
import {
  AppType,
  PathDetails,
  Options,
  PathWithPNG,
  PlatformType,
  ImagePaths,
  HandleMismatchParams,
} from "./type.js";
import {
  VDI_IMAGE_WIDTH,
  VDI_IMAGE_HEIGHT,
  defaultCompareOptions,
} from "./config.js";
import { driver } from "@wdio/globals";
// Include all utility functions here, such as determinePlatform, createDirectoryFromPlatform, getPath, etc.
const determinePlatform = (appType: AppType): PlatformType => {
  return appType.toLowerCase() === "desktop" ||
    appType.toLowerCase() === "oldDesktop"
    ? PlatformType.Desktop
    : PlatformType.Web;
};

const createDirectoryFromPlatform = (platfrom: PlatformType) => {
  const isSuccess = true;
  try {
    if (platfrom === PlatformType.Desktop) {
      fs.mkdirSync("./visual-test/desktop", { recursive: true });
    }
    if (platfrom === PlatformType.Web) {
      fs.mkdirSync("./visual-test/web", { recursive: true });
    }
    return isSuccess;
  } catch (error) {
    return !isSuccess;
  }
};

const getPath = (
  { filename, apptype, platform }: PathDetails,
  options: {
    isBaseline?: boolean;
    isCompare?: boolean;
    isDiff?: boolean;
  }
): PathWithPNG => {
  const baselineFolder = options.isBaseline ? "baseline" : "";
  const diffFolder = options.isDiff ? "compare/diff" : "";
  const compareFolder = options.isBaseline ? "compare" : "";

  return path.join(
    process.cwd(),
    "screenshots",
    baselineFolder,
    compareFolder,
    diffFolder,
    apptype,
    platform,
    `${filename}.png`
  ) as PathWithPNG;
};

const captureScreenshot = async ({ selector, filename, frame }: Options) => {
  if (frame) {
    //do something with additional frame
  }
  return await (await driver.$(selector)).saveScreenshot(filename);
};

const getIMGMetadata = async (imagePath: PathWithPNG) => {
  return await sharp(imagePath).metadata();
};

const IsSameDimension = (
  baselineIMGDimension: sharp.Metadata,
  currentIMGDimension: sharp.Metadata
) => {
  return (
    baselineIMGDimension.width === currentIMGDimension.width &&
    baselineIMGDimension.height === currentIMGDimension.height
  );
};

/**
 * Resizes an image using the specified options and returns the output information.
 *
 * @param {PathWithPNG} currIMGPath - the path of the current image to be resized
 * @param {sharp.ResizeOptions} options - the options for resizing the image
 * @return {Promise<sharp.OutputInfo>} the output information of the resized image
 */
const resizeIMG = async (
  currIMGPath: PathWithPNG,
  options: sharp.ResizeOptions = {}
): Promise<sharp.OutputInfo> => {
  if (!options.width) {
    options.width = VDI_IMAGE_WIDTH;
  }
  if (!options.height) {
    options.height = VDI_IMAGE_HEIGHT;
  }
  if (!options.fit) {
    options.fit = "fill";
  }
  return await sharp(currIMGPath).resize(options).toFile(currIMGPath);
};

const diffPNG = new PNG({
  width: VDI_IMAGE_WIDTH,
  height: VDI_IMAGE_HEIGHT,
});

const compareIMG = (
  {
    img1,
    img2,
  }: {
    img1: PNGWithMetadata;
    img2: PNGWithMetadata;
  },
  options: PixelmatchOptions = defaultCompareOptions
) => {
  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diffPNG.data,
    VDI_IMAGE_WIDTH,
    VDI_IMAGE_HEIGHT,
    options
  );
  return numDiffPixels;
};

/**
 * Decode PNG from the given file path.
 *
 * @param {PathWithPNG} imagePath - the path to the PNG image file
 * @return {PNG} the decoded PNG image
 */
const decodePNGFromPath = (imagePath: PathWithPNG) => {
  const imageBuffer = fs.readFileSync(imagePath);
  return PNG.sync.read(imageBuffer);
};

/**
 * Writes the provided image buffer to the specified image path.
 *
 * @param {PathWithPNG} imagePath - the path where the image will be written
 * @param {PNG} imageBuffer - the buffer containing the image data
 * @return {void}
 */
const writeIMG = (imagePath: PathWithPNG, imageBuffer: PNG) => {
  return fs.writeFileSync(imagePath, PNG.sync.write(imageBuffer));
};

const handleFailedComparison = ({
  failFolder,
  platform,
  filename,
}: {
  failFolder: PathWithPNG;
  platform: PlatformType;
  filename: string;
}) => {
  const failedScreenshots = [];
  console.error("Skipping comparison due to missing image data");
  failedScreenshots.push(failFolder);
  fs.writeFileSync(`failed-screenshots.txt`, failedScreenshots.join("\n"));
  if (appconfig.pushnewBaseImageToSharedDrive === "true") {
    const destinationPath = `drive/xxx/${platform}/${filename}_BETA.png`;
    try {
      fs.copyFileSync(failFolder, destinationPath);
    } catch (error) {
      console.error(error);
      throw new Error("Failed to copy file to xxx Drive");
    }
  }
  return {
    result: false,
    message: "Failed to compare due to missing image data",
  };
};

/**
 * Handles the mismatch between baseline and current screenshots.
 *
 * @param {ImagePaths} paths - object containing paths to images
 * @param {HandleMismatchParams} object - object containing baseline image, diff image, and numdiff
 * @return {object} object with result and message properties
 */
const handleMismatch = (
  paths: ImagePaths,
  { baselinePNG, diffPNG, numdiff }: HandleMismatchParams
) => {
  const failedScreenshots = [];
  writeIMG(paths.diff, diffPNG);
  failedScreenshots.push(paths.current);
  fs.writeFileSync(`failed-screenshots.txt`, failedScreenshots.join("\n"));
  const { width, height } = baselinePNG;
  const total = 1 - numdiff / (width * height);
  const matchPercent = parseFloat(Math.round(total * 100).toFixed(2));
  console.log(
    `Mismatch found in screenshot ${paths.current} with ${matchPercent}% match`
  );
  const pixelThreshold = appconfig.threshold;

  if (matchPercent < pixelThreshold) {
    return {
      result: false,
      message: `Mismatch found in screenshot ${paths.current} with ${matchPercent}% match`,
    };
  }
};
export {
  determinePlatform,
  createDirectoryFromPlatform,
  getPath,
  captureScreenshot,
  getIMGMetadata,
  IsSameDimension,
  resizeIMG,
  diffPNG,
  compareIMG,
  decodePNGFromPath,
  writeIMG,
  handleFailedComparison,
  handleMismatch,
};
