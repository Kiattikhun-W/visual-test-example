import { PixelmatchOptions } from "pixelmatch";
import appconfig from "../../appconfig.json";
import { AppType } from "../types/type.js";

export const APP_TYPE = appconfig.apptype as AppType;
export const VDI_IMAGE_WIDTH = 1280;
export const VDI_IMAGE_HEIGHT = 1040;

const threshold = appconfig.threshold ?? 0.1;

export const defaultCompareOptions: PixelmatchOptions = {
  threshold,
  diffColor: [255, 0, 0],
  alpha: 0,
  diffMask: true,
  diffColorAlt: [0, 255, 0],
};
