import { PNG, PNGWithMetadata } from "pngjs";

type Brand<Type, Key> = Type & { _brand: Key };

export type AppType = Brand<string, "apptype">;
export type PathWithPNG = `${string}.png`;

/**
 * Represents the element selector and the filename for the screenshot.
 */
export interface Options {
  /**
   * selector - The element selector for the screenshot.
   */
  selector: string;
  /**
   * filename - The title for the screenshot, We'll use this for compare image as the same title.
   */
  filename: string;
  frame?: string;
}

export interface PathDetails {
  filename: string;
  apptype: AppType;
  platform: PlatformType;
}

export enum PlatformType {
  Desktop = "desktop",
  Web = "web",
}
export type HandleMismatchParams = {
  baselinePNG: PNGWithMetadata;
  diffPNG: PNG;
  numdiff: number;
};
export type ImagePaths = {
  baseline: PathWithPNG;
  current: PathWithPNG;
  diff: PathWithPNG;
};
export type ImageComparisonResults = {
  result: boolean;
  message: string;
  numDiffPixels: number;
};
