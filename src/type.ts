type Brand<Type, Key> = Type & { _brand: Key };

export type AppType = Brand<string, "apptype">;
export type PathWithPNG = `${string}.png`;

export interface Options {
  selector: string;
  filename: string;
  frame?: string;
}

export interface GetPath {
  filename: string;
  apptype: AppType;
  platform: PlatformType;
}

export enum PlatformType {
  Desktop = "desktop",
  Web = "web",
}
