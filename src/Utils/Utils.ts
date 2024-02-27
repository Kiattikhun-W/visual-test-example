import path from "path";
import fs from "fs";
import sharp from "sharp";
import { PNG, PNGWithMetadata } from "pngjs";
import pixelmatch, { PixelmatchOptions } from "pixelmatch";
import appconfig from "../../appconfig.json";
import {
  AppType,
  PathDetails,
  Options,
  PathWithPNG,
  PlatformType,
  ImagePaths,
  HandleMismatchParams,
} from "../types/type.js";
import {
  VDI_IMAGE_WIDTH,
  VDI_IMAGE_HEIGHT,
  defaultCompareOptions,
} from "../config/config.js";

const writeFile = (
  path: string,
  data: Buffer | string,
  options?: fs.WriteFileOptions | undefined
) => {
  fs.writeFileSync(path, data, options);
};

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
      fs.mkdirSync("./screenshots/", { recursive: true });
    }
    if (platfrom === PlatformType.Web) {
      fs.mkdirSync("./screenshots/", { recursive: true });
    }
    return isSuccess;
  } catch (error) {
    return !isSuccess;
  }
};

const createDirectoryFromPath = (path: string) => {
  const isSuccess = true;
  try {
    const regex = new RegExp(/^(.*[\/\\])([^\/\\]+\.png)$/);
    const match = regex.exec(path);
    if (match) {
      fs.mkdirSync(match[1], { recursive: true });
      return isSuccess;
    } else {
      fs.mkdirSync(path, { recursive: true });
    }
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
  const compareFolder = options.isCompare ? "compare" : "";

  return path.join(
    process.cwd(),
    "screenshots",
    baselineFolder,
    compareFolder,
    diffFolder,
    // apptype,
    platform,
    `${filename}.png`
  ) as PathWithPNG;
};

const captureScreenshot = async (
  { selector, filename, frame }: Options,
  browser: WebdriverIO.Browser
) => {
  if (frame) {
    //do something with additional frame
  }
  return await (await browser.$(selector)).saveScreenshot(filename);
};

const getIMGMetadata = async (imagePath: PathWithPNG) => {
  try {
    return await sharp(imagePath).metadata();
  } catch (error) {
    return null;
  }
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
 * @param {PathWithPNG} IMG - the path of the current image to be resized
 * @param {sharp.ResizeOptions} options - the options for resizing the image
 * @return {Promise<sharp.OutputInfo>} the output information of the resized image
 */
const resizeIMG = async (
  IMG: PathWithPNG,
  options: sharp.ResizeOptions = {}
): Promise<void> => {
  if (!options.width) {
    options.width = VDI_IMAGE_WIDTH;
  }
  if (!options.height) {
    options.height = VDI_IMAGE_HEIGHT;
  }
  if (!options.fit) {
    options.fit = "fill";
  }

  await sharp(IMG).resize(options).toFile(`${IMG}.resize.png`);
  fs.copyFileSync(`${IMG}.resize.png`, IMG);
  fs.unlinkSync(`${IMG}.resize.png`);
};

const compareIMG = (
  path: PathWithPNG,
  {
    img1,
    img2,
    width = VDI_IMAGE_WIDTH,
    height = VDI_IMAGE_HEIGHT,
  }: {
    img1: PNGWithMetadata;
    img2: PNGWithMetadata;
    width: number;
    height: number;
  },
  options: PixelmatchOptions = defaultCompareOptions
) => {
  const diffPNG = new PNG({
    width,
    height,
  });
  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diffPNG.data,
    width,
    height,
    { threshold: 0.1 }
  );

  return { numDiffPixels, diffPNG };
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
  console.info('Writing image to "%s"', imagePath);
  writeFile(imagePath, PNG.sync.write(imageBuffer));
  console.info('Successfully wrote image to "%s"', imagePath);
};

/**
 * Handles the failed comparison of screenshots.
 *
 * @param failFolder - The path to the folder containing the failed screenshot.
 * @param platform - The platform type.
 * @param filename - The name of the screenshot file.
 * @returns An object with the result and message indicating the failure.
 */
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
  writeFile(`failed-screenshots.txt`, failedScreenshots.join("\n"));
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

const calculateMatchPercent = (
  baselinePNG: { width: number; height: number },
  numDiffPixels: number
): number => {
  const RATIO_TO_PERCENTAGE = 100; // Converts a ratio to a percentage

  const totalPixels = baselinePNG.width * baselinePNG.height;
  const matchRatio = 1 - numDiffPixels / totalPixels;
  return parseFloat((matchRatio * RATIO_TO_PERCENTAGE).toFixed(2));
};

const writeFailedScreenshot = (
  failedScreenshotPath: string,
  screenshots: string[]
) => {
  writeFile(failedScreenshotPath, screenshots.join("\n"));
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
  const matchPercent = calculateMatchPercent(baselinePNG, numdiff);
  console.log(
    `Mismatch found in screenshot ${paths.current} with ${matchPercent}% match`
  );
  if (appconfig.threshold < matchPercent) {
    const failedScreenshots = [paths.current];
    writeIMG(paths.diff, diffPNG);

    writeFailedScreenshot("failed-screenshots.txt", failedScreenshots);

    return {
      result: false,
      message: `Mismatch found in screenshot ${paths.current} with ${matchPercent}% match`,
    };
  }
  return {
    result: true,
  };
};

export {
  determinePlatform,
  createDirectoryFromPlatform,
  getPath,
  captureScreenshot,
  getIMGMetadata,
  IsSameDimension,
  resizeIMG,
  compareIMG,
  decodePNGFromPath,
  writeIMG,
  handleFailedComparison,
  handleMismatch,
  createDirectoryFromPath,
  writeFailedScreenshot,
};
