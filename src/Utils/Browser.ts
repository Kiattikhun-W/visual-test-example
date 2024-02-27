import { remote } from "webdriverio";

let browserInstance: WebdriverIO.Browser | null = null;

export const clearBrowser = () => {
  if (browserInstance) {
    browserInstance.deleteSession();
    browserInstance = null;
  }
};

export async function initBrowser() {
  if (browserInstance) {
    console.log("Reusing the existing browser instance.");
    return browserInstance;
  } else {
    console.log("Creating a new browser instance.");
    browserInstance = await remote({
      capabilities: {
        browserName: "chrome",
      },
    });

    return browserInstance;
  }
}
