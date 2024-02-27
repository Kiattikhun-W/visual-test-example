import { PNG, PNGWithMetadata } from "pngjs";

type Brand<Type, Key> = Type & { _brand: Key };

export type AppType = Brand<string, "apptype">;
export type PathWithPNG = `${string}.png`;

export interface Options {
  selector: string;
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
