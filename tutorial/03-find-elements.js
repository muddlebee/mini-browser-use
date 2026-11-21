// Chapter 5: find every element a person could interact with, and keep only the visible ones.
//   node tutorial/03-find-elements.js
const { launch, PRACTICE_PAGE } = require('./helpers');

(async () => {
  const { browser, page } = await launch();
  await page.goto(PRACTICE_PAGE);

  const found = await page.evaluate(() => {
    // A CSS selector meaning "links, buttons, and form fields".
    const interactive = 'a[href], button, input, textarea, select';
    const results = [];
    for (const el of Array.from(document.querySelectorAll(interactive))) {
      const box = el.getBoundingClientRect();     // where it is on screen, in pixels
      const style = getComputedStyle(el);         // its final CSS, after all rules applied
      const visible = box.width > 0 && box.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      results.push({
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.placeholder || '').trim(),
        visible,
        x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height),
      });
    }
    return results;
  });

  console.table(found);
  console.log('A person (or an agent) can only use the rows where visible is true.');
  await browser.close();
})();
