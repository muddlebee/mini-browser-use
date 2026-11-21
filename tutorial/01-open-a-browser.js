// Chapter 4: a program opens a real browser, visits a page, and takes a picture of it.
//   node tutorial/01-open-a-browser.js
const path = require('path');
const { chromium } = require('playwright');
const { PRACTICE_PAGE, OUTPUT } = require('./helpers');

(async () => {
  // 1. Start a browser. "headless" means no window on screen; it is still a full browser.
  const channel = ['chrome', 'msedge'].includes(process.env.BROWSER) ? process.env.BROWSER : undefined;
  const browser = await chromium.launch({ headless: !process.env.HEADED, channel });

  // 2. Open a tab (Playwright calls it a "page") and go to an address.
  const page = await browser.newPage();
  await page.goto(PRACTICE_PAGE);

  // 3. Ask the browser things about the page.
  console.log('Address:', page.url());
  console.log('Title:  ', await page.title());

  // 4. Take a screenshot: exactly what a person would see.
  const file = path.join(OUTPUT, '01-practice-page.png');
  await page.screenshot({ path: file });
  console.log('Saved a screenshot to', file);

  // 5. Always close the browser, or the program keeps running.
  await browser.close();
})();
