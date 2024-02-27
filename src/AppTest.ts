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
const browser = AppTest();

describe("webdriver.io page", function () {
  after(async () => {
    await (await browser).closeWindow();
    await (await browser).deleteSession();
  });
  it("should be return true because img is static", async () => {
    await (await browser).url("https://webdriver.io/");
    const { result, message, numDiffPixels } = await checkScreenshots(
      {
        selector: `a.button[href="/docs/gettingstarted"]`,
        // selector: "#ms-floating-button",
        filename: "test2",
      },
      await browser
    );
    console.log(
      `result: ${result}, message: ${message}, numDiffPixels: ${numDiffPixels}`
    );

    assert.isTrue(result);
  });

  it("should be return false because different img", async () => {
    await (await browser).url("https://webdriver.io/");
    const { result, message, numDiffPixels } = await checkScreenshots(
      {
        // selector: `a.button[href="/docs/gettingstarted"]`,
        selector: "#ms-floating-button",
        filename: "test2",
      },
      await browser
    );

    console.log(
      `result: ${result}, message: ${message}, numDiffPixels: ${numDiffPixels}`
    );

    assert.isFalse(result);
  });
});
