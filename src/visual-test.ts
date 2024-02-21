import appconfig from "../appconfig.json";
import fs from "fs";

import {
  AppType,
  PlatformType,
  GetPath,
  Options,
  PathWithPNG,
} from "./type.js";
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
  resizeIMG,
  writeIMG,
} from "./Utils.js";

const compareScreenshots = async ({ selector, filename, frame }: Options) => {
  const platform = determinePlatform(APP_TYPE);
  createDirectoryFromPlatform(platform);

  const paths = {
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

  let baselineIMGDimension = await getIMGMetadata(paths.baseline);
  let currentIMGDimension = await getIMGMetadata(paths.current);

  console.log(currentIMGDimension);

  const isSameIMGSize = IsSameDimension(
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

  const baselinePNG = decodePNGFromPath(paths.baseline);
  const currentPNG = decodePNGFromPath(paths.current);

  const failedScreenshots = [];

  if (!baselinePNG || !currentPNG) {
    console.error("Skipping comparison due to missing image data");
    failedScreenshots.push(paths.current);
    fs.writeFileSync(`failed-screenshots.txt`, failedScreenshots.join("\n"));
    if (appconfig.pushnewBaseImageToSharedDrive === "true") {
      const destinationPath = `drive/xxx/${platform}/${filename}_BETA.png`;
      try {
        fs.copyFileSync(paths.current, destinationPath);
      } catch (error) {
        console.error(error);
        throw new Error("Failed to copy file to xxx Drive");
      }
    }
    return {
      result: false,
      message: "Failed to compare due to missing image data",
    };
  }

  const numdiff = compareIMG({
    img1: baselinePNG,
    img2: currentPNG,
  });

  if (numdiff > 0) {
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
    return {
      result: true,
      message: `Match found in screenshot ${paths.current} with ${matchPercent}% match`,
    };
  }
};
