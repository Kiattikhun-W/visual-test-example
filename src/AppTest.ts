import { remote } from "webdriverio";
import { checkScreenshots } from "./visual-test.js";

async function AppTest() {
  const browser = await remote({
    logLevel: "silent",
    capabilities: {
      browserName: "chrome",
    },
  });

  await browser.url("https://webdriver.io/");
  await checkScreenshots(
    {
      selector: ".hero__title",
      // selector: "#ms-floating-button",
      filename: "test2",
    },
    browser
  );
  await browser.deleteSession();
}
AppTest();
