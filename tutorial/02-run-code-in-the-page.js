// Chapter 4: page.evaluate() sends a function into the page, runs it there, and brings the answer back.
//   node tutorial/02-run-code-in-the-page.js
const { launch, PRACTICE_PAGE } = require('./helpers');

(async () => {
  const { browser, page } = await launch();
  await page.goto(PRACTICE_PAGE);

  // This function runs INSIDE the browser, where `document` (the page's DOM) exists.
  const heading = await page.evaluate(() => document.querySelector('h1').textContent);
  console.log('The heading says:', heading);

  // Only plain data (text, numbers, lists, objects) can travel back to our program.
  const counts = await page.evaluate(() => ({
    allElements: document.querySelectorAll('*').length,
    buttons: document.querySelectorAll('button').length,
    links: document.querySelectorAll('a').length,
  }));
  console.log('Counts:', counts);

  // We can also CHANGE the page. This edits the DOM, and the browser redraws it.
  await page.evaluate(() => { document.querySelector('h1').textContent = 'Changed by our program'; });
  console.log('Heading now:', await page.evaluate(() => document.querySelector('h1').textContent));

  // The function is sent as text, so it cannot see variables from our program.
  // Pass them in explicitly as a second argument instead:
  const greeting = 'Hello from Node';
  await page.evaluate((text) => { document.querySelector('h1').textContent = text; }, greeting);
  console.log('Heading now:', await page.evaluate(() => document.querySelector('h1').textContent));

  await browser.close();
})();
