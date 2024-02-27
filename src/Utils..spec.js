import { expect, test, describe, it, beforeAll, vi } from "vitest";
import fs from "fs";
import * as Util from "./Utils";

describe("getIMGMetadata", () => {
  test("should return the metadata of the image", async () => {
    // Arrange
    const image = `${process.cwd()}/unit-test.png`;
    // Act
    const metadata = await Util.getIMGMetadata(image);
    // Assert
    expect(metadata.width).not.null;
    expect(metadata.height).not.null;
    expect(metadata.format).toEqual("png");
  });

  test("should throw an error if the image does not exist", async () => {
    // Arrange
    const image = `${process.cwd()}/unit-test-2.png`;
    // Act

    const emptyIMG = await Util.getIMGMetadata(image);

    // Assert

    expect(emptyIMG).toEqual(null);
  });
});

describe("IsSameDimension", () => {
  test("should return true if the dimensions are the same", () => {
    // Arrange
    const baselineIMGDimension = {
      width: 100,
      height: 100,
      chromaSubsampling: "4:2:0", // Add the missing property
    };
    const currentIMGDimension = {
      width: 100,
      height: 100,
      chromaSubsampling: "4:2:0", // Add the missing property
    };
    // Act
    const result = Util.IsSameDimension(
      baselineIMGDimension,
      currentIMGDimension
    );
    // Assert
    expect(result).toEqual(true);
  });

  test("should return false if the dimensions are different", () => {
    // Arrange
    const baselineIMGDimension = {
      width: 100,
      height: 100,
      chromaSubsampling: "4:2:0",
    };
    const currentIMGDimension = {
      width: 200,
      height: 200,
      chromaSubsampling: "4:2:0",
    };
    // Act
    const result = Util.IsSameDimension(
      baselineIMGDimension,
      currentIMGDimension
    );
    // Assert
    expect(result).toEqual(false);
  });
});

describe("writeFailedScreenshot", () => {
  test("should write the screenshots to the file", () => {
    // Arrange
    const failedScreenshotPath = "failed-screenshots.txt";
    const screenshots = [
      "screenshot1.png",
      "screenshot2.png",
      "screenshot3.png",
    ];

    // Act
    Util.writeFailedScreenshot(failedScreenshotPath, screenshots);

    // Assert
    const fileContent = fs.readFileSync(failedScreenshotPath, "utf-8");
    expect(fileContent).toEqual(
      "screenshot1.png\nscreenshot2.png\nscreenshot3.png"
    );
  });
});
