// Regenerates the screenshots used in the docs, using the library's own code.
//   node docs/scripts/generate-images.js
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { observePage } = require('../../src/page');

const root = path.join(__dirname, '..', '..');
const out = path.join(__dirname, '..', 'public', 'images');
fs.mkdirSync(out, { recursive: true });

// Same drawing as labelledScreenshot() in src/page.js, saved as PNG at double resolution for the docs.
async function labelled(page, file) {
  const { boxes } = await observePage(page);
  await page.evaluate((list) => {
    const layer = document.createElement('div');
    layer.id = '__mbu_labels';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    for (const b of list) {
      const box = document.createElement('div');
      box.style.cssText = `position:fixed;left:${b.x}px;top:${b.y}px;width:${b.width}px;height:${b.height}px;outline:2px solid #e11d48;box-sizing:border-box`;
      const tag = document.createElement('span');
      tag.textContent = String(b.id);
      tag.style.cssText = `position:absolute;left:-2px;top:${b.y < 16 ? 0 : -16}px;background:#e11d48;color:#fff;font:bold 12px/16px sans-serif;padding:0 4px;border-radius:3px`;
      box.appendChild(tag);
      layer.appendChild(box);
    }
    document.documentElement.appendChild(layer);
  }, boxes);
  await page.screenshot({ path: path.join(out, file) });
  await page.evaluate(() => document.getElementById('__mbu_labels')?.remove());
}

(async () => {
  const channel = ['chrome', 'msedge'].includes(process.env.BROWSER) ? process.env.BROWSER : undefined;
  const browser = await chromium.launch({ channel });
  const page = await browser.newPage({ viewport: { width: 560, height: 170 }, deviceScaleFactor: 2 });

  await page.goto('file://' + path.join(root, 'test.html'));
  await page.screenshot({ path: path.join(out, 'practice-page.png') });
  await labelled(page, 'practice-labelled.png');

  await page.setViewportSize({ width: 560, height: 330 });
  await page.goto('file://' + path.join(root, 'evals', 'pages', 'payment.html'));
  await page.waitForTimeout(300);
  await labelled(page, 'frames-labelled.png');

  await browser.close();
  console.log('Images written to', out);
})();
