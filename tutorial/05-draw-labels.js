// Chapter 7: draw a numbered box over each element, take a screenshot, then remove the boxes.
//   node tutorial/05-draw-labels.js
const path = require('path');
const { launch, PRACTICE_PAGE, OUTPUT } = require('./helpers');

(async () => {
  const { browser, page } = await launch();
  await page.goto(PRACTICE_PAGE);

  // Add one new <div> per element, positioned exactly over it. They are ordinary HTML
  // added by us: red outline, number tag, on top of everything, and they ignore the mouse.
  await page.evaluate(() => {
    const layer = document.createElement('div');
    layer.id = 'labels';
    layer.style.cssText = 'position:fixed; inset:0; pointer-events:none; z-index:2147483647';
    let n = 0;
    for (const el of Array.from(document.querySelectorAll('a[href], button, input'))) {
      const r = el.getBoundingClientRect();
      const box = document.createElement('div');
      box.style.cssText = `position:fixed; left:${r.left}px; top:${r.top}px; width:${r.width}px; height:${r.height}px;` +
        'outline:2px solid #e11d48';
      const tag = document.createElement('span');
      tag.textContent = String(n++);
      tag.style.cssText = 'position:absolute; left:0; top:-16px; background:#e11d48; color:white; font:bold 12px sans-serif; padding:0 4px';
      box.appendChild(tag);
      layer.appendChild(box);
    }
    document.body.appendChild(layer);
  });

  const file = path.join(OUTPUT, '05-labelled.png');
  await page.screenshot({ path: file });
  console.log('Saved', file);

  // Remove our boxes so they never get in the way of the real page.
  await page.evaluate(() => document.getElementById('labels').remove());
  await browser.close();
})();
