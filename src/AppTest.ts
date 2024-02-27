import { remote } from "webdriverio";
import { checkScreenshots } from "./Utils/visual-test.js";
import { assert } from "chai";

import { describe, it } from "mocha";
async function Browser() {
  return remote({
    logLevel: "silent",
    capabilities: {
      browserName: "chrome",
    },
  });
}
// const browser = null;

describe("webdriver.io page", function () {
  let browser: WebdriverIO.Browser; // Declare 'browser' at the test suite level

  beforeEach(async () => {
    browser = await Browser();
  });
  afterEach(async () => {
    await browser.closeWindow();
    await browser.deleteSession();
  });
  describe("save stupid baseline", async function () {
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
  });

  describe("should be return true because img is static", async function () {
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
  });

  describe("should be return false because different img", async function () {
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
});
