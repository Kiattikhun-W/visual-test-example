import { remote } from "webdriverio";
import { compareScreenshots } from "./visual-test.js";

async function AppTest() {
  const browser = await remote({
    logLevel: "silent",
    capabilities: {
      browserName: "chrome",
    },
  });

  await browser.url("https://webdriver.io/");
  await compareScreenshots(
    {
      selector: ".hero__title",
      filename: "test",
    },
    browser
  );
  await browser.deleteSession();
}
AppTest();
