import { remote } from "webdriverio";
import { checkScreenshots } from "./Utils/visual-test.js";
import { assert } from "chai";

import { describe, it } from "mocha";
async function AppTest() {
  return await remote({
    logLevel: "silent",
    capabilities: {
      browserName: "chrome",
    },
  });
}
// const browser = null;

describe("webdriver.io page", function () {
  let browser: WebdriverIO.Browser; // Declare 'browser' at the test suite level

  before(async () => {
    browser = await AppTest();
  });
  after(async () => {
    await browser.closeWindow();
    await browser.deleteSession();
  });

  it("stupid test", async function () {
    await browser.url("https://webdriver.io/");
    const { result, message, numDiffPixels } = await checkScreenshots(
      {
        selector: `a.button[href="/docs/gettingstarted"]`,
        // selector: "#ms-floating-button",
        filename: "test2",
      },
      browser
    );
    console.log(
      `result: ${result}, message: ${message}, numDiffPixels: ${numDiffPixels}`
    );
  });

  it("should be return true because img is static", async function () {
    await browser.url("https://webdriver.io/");
    const { result, message, numDiffPixels } = await checkScreenshots(
      {
        selector: `a.button[href="/docs/gettingstarted"]`,
        // selector: "#ms-floating-button",
        filename: "test2" + this.test?.title + this.test?.fullTitle(),
      },
      browser
    );
    console.log(
      `result: ${result}, message: ${message}, numDiffPixels: ${numDiffPixels}`
    );

    assert.isTrue(result);
  });

  it("should be return false because different img", async function () {
    await browser.url("https://webdriver.io/");
    const { result, message, numDiffPixels } = await checkScreenshots(
      {
        // selector: `a.button[href="/docs/gettingstarted"]`,
        selector: "#ms-floating-button",
        filename: "test2",
      },
      browser
    );

    console.log(
      `result: ${result}, message: ${message}, numDiffPixels: ${numDiffPixels}`
    );

    assert.isFalse(result);
  });
});
