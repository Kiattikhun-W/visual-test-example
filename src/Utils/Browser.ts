import { remote } from "webdriverio";

let browserInstance: WebdriverIO.Browser | null = null;

export const clearBrowser = async () => {
  if (browserInstance) {
    await browserInstance.deleteSession();
    browserInstance = null;
  }
};

export async function initBrowser() {
  if (browserInstance) {
    console.log("Reusing the existing browser instance.");
    return browserInstance;
  } else {
    console.log("Creating a new browser instance.");
    try {
      browserInstance = await remote({
        capabilities: {
          browserName: "chrome",
          browserVersion: "dev",
        },
      });
    } catch (error) {
      throw new Error("Failed to create a new browser instance.");
    }

    return browserInstance;
  }
}
