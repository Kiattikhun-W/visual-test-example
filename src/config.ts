import { PixelmatchOptions } from "pixelmatch";
import appconfig from "../appconfig.json";
import { AppType } from "./type.js";

export const APP_TYPE = appconfig.apptype as AppType;
export const VDI_IMAGE_WIDTH = 1280;
export const VDI_IMAGE_HEIGHT = 1040;

export const defaultCompareOptions: PixelmatchOptions = {
  threshold: 0.1,
  diffColor: [255, 0, 0],
  alpha: 0,
  diffMask: true,
  diffColorAlt: [0, 255, 0],
};
