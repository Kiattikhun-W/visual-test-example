import path from "path";
import fs from "fs";
import sharp from "sharp";
import { PNG } from "pngjs";
import pixelmatch, { PixelmatchOptions } from "pixelmatch";
import {
  AppType,
  GetPath,
  Options,
  PathWithPNG,
  PlatformType,
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
  { filename, apptype, platform }: GetPath,
  options?: {
    isBaseline?: boolean;
    isCompare?: boolean;
    isDiff?: boolean;
  }
) => {
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

const resizeIMG = async (
  currIMGPath: PathWithPNG,
  options?: sharp.ResizeOptions
) => {
  if (!options.width) {
    options.width = VDI_IMAGE_WIDTH;
  }
  if (!options.height) {
    options.height = VDI_IMAGE_HEIGHT;
  }
  if (!options.fit) {
    options.fit = "fill";
  }
  await sharp(currIMGPath).resize(options).toFile(currIMGPath);
};

const diffPNG = new PNG({
  width: VDI_IMAGE_WIDTH,
  height: VDI_IMAGE_HEIGHT,
});

const compareIMG = (
  { img1, img2 },
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

const decodePNGFromPath = (imagePath: PathWithPNG) => {
  const imageBuffer = fs.readFileSync(imagePath);
  return PNG.sync.read(imageBuffer);
};

const writeIMG = (imagePath: PathWithPNG, imageBuffer: PNG) => {
  return fs.writeFileSync(imagePath, PNG.sync.write(imageBuffer));
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
};
