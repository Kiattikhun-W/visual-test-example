import { checkScreenshots } from "./Utils/visual-test.js";
import { assert } from "chai";

import { describe, it } from "mocha";
import { clearBrowser, initBrowser } from "./Utils/Browser.js";

// const browser = null;
// Define options for the WebDriver

let browser: WebdriverIO.Browser;

describe("webdriver.io page", function () {
  beforeEach(async () => {
    browser = await initBrowser();
  });
  afterEach(async () => {
    clearBrowser();
  });
  describe("save stupid baseline", async function () {
    it("stupid test", async function () {
      await browser.url("https://webdriver.io/");
      const { result, message, numDiffPixels } = await checkScreenshots({
        selector: `a.button[href="/docs/gettingstarted"]`,
        filename: "test2",
      });
      console.log(
        `%c result: ${result}, message: ${message}, numDiffPixels: ${numDiffPixels}`,
        `background: #222; color: #bada55'`
      );
    });
  });

  describe("should be return true because img is static", async function () {
    it("should be return true because img is static", async function () {
      await browser.url("https://webdriver.io/");
      const { result, message, numDiffPixels } = await checkScreenshots({
        selector: `a.button[href="/docs/gettingstarted"]`,
        filename: "test2" + this.test?.title,
      });
      console.log(
        `result: ${result}, message: ${message}, numDiffPixels: ${numDiffPixels}`
      );

      assert.isTrue(result);
    });
  });

  describe("should be return false because different img", async function () {
    it("should be return false because different img", async function () {
      await browser.url("https://webdriver.io/");
      const { result, message, numDiffPixels } = await checkScreenshots({
        selector: "#ms-floating-button",
        filename: "test2",
      });

      console.log(
        `result: ${result}, message: ${message}, numDiffPixels: ${numDiffPixels}`
      );

      assert.isFalse(result);
    });
  });
});
