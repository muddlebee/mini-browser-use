// Chapter 6: give each element a number, then click and type by number, with real mouse and keyboard events.
//   node tutorial/04-number-and-act.js
const { launch, PRACTICE_PAGE } = require('./helpers');

(async () => {
  const { browser, page } = await launch();
  await page.goto(PRACTICE_PAGE);

  // 1. Number the visible interactive elements and write each number ONTO the element
  //    as an attribute, data-mbu="0", data-mbu="1", ... so we can find it again later.
  const list = await page.evaluate(() => {
    const lines = [];
    for (const el of Array.from(document.querySelectorAll('a[href], button, input, textarea, select'))) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      const n = lines.length;
      el.setAttribute('data-mbu', String(n));
      lines.push(`[${n}] <${el.tagName.toLowerCase()}> ${(el.innerText || el.placeholder || '').trim()}`);
    }
    return lines;
  });
  console.log(list.join('\n'));

  // 2. Act by number. '[data-mbu="0"]' is a CSS selector meaning "the element whose data-mbu is 0".
  await page.locator('[data-mbu="0"]').fill('Ada');   // types into the name box
  await page.locator('[data-mbu="1"]').click();       // presses Greet
  console.log('\nThe page now says:', await page.locator('#o').textContent());

  // 3. Real events versus fake ones. The page can tell the difference through event.isTrusted.
  await page.evaluate(() => {
    window.seen = [];
    document.querySelector('button').addEventListener('click', (e) => window.seen.push(e.isTrusted));
  });
  await page.evaluate(() => document.querySelector('button').click()); // a script calling .click()
  await page.locator('[data-mbu="1"]').click();                          // Playwright: real mouse input
  const seen = await page.evaluate(() => window.seen);
  console.log('isTrusted for script click:', seen[0], '| for Playwright click:', seen[1]);

  await browser.close();
})();
