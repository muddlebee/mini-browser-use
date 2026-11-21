// Code that runs inside the web page. page.evaluate() ships each function to the
// browser as text, runs it there, and sends the return value back as JSON.
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// Accept a URL, a bare domain, or a path to a local file (works on Windows too).
function toUrl(target) {
  if (fs.existsSync(target)) return pathToFileURL(path.resolve(target)).href;
  return /^[a-z][a-z0-9+.-]*:/i.test(target) ? target : 'https://' + target;
}

// OBSERVE: number every visible interactive element, write the number onto it as a
// data-mbu attribute (so actions can find it again), and return one line per element.
async function observePage(page) {
  const elements = await page.evaluate(() => {
    const SEL = 'a[href],button,input,textarea,select,summary,[role=button],[role=link],' +
      '[role=tab],[role=checkbox],[role=menuitem],[onclick],[contenteditable=true],[tabindex]:not([tabindex="-1"])';
    document.querySelectorAll('[data-mbu]').forEach((e) => e.removeAttribute('data-mbu'));
    const out = [];
    for (const el of document.querySelectorAll(SEL)) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const visible = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
      const inViewport = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      if (!visible || !inViewport || el.disabled) continue;
      const id = out.length;
      el.setAttribute('data-mbu', id);
      const tag = el.tagName.toLowerCase();
      const clean = (t) => (t || '').trim().replace(/\s+/g, ' ');
      let label = clean(el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') ||
        el.title || el.name).slice(0, 60);
      let extra = tag === 'input' ? ` type=${el.type}`
        : tag === 'a' ? ` -> ${(el.getAttribute('href') || '').slice(0, 50)}` : '';
      if (tag === 'select') { // show the current choice, then every option
        label = clean(el.options[el.selectedIndex]?.text);
        extra = ` options=[${[...el.options].map((o) => clean(o.text)).join(' | ')}]`.slice(0, 150);
      }
      out.push(`[${id}] <${tag}${extra}> ${label}`);
    }
    return out;
  });
  return { url: page.url(), title: await page.title(), elements };
}

// Screenshot with each numbered element outlined and tagged, so the picture matches the list.
// Uses the data-mbu tags from the last observePage(). Returns a JPEG buffer.
async function labelledScreenshot(page) {
  await page.evaluate(() => {
    const layer = document.createElement('div');
    layer.id = '__mbu_labels';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    for (const el of document.querySelectorAll('[data-mbu]')) {
      const r = el.getBoundingClientRect();
      const box = document.createElement('div');
      box.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;` +
        'outline:2px solid #e11d48;box-sizing:border-box';
      const tag = document.createElement('span');
      tag.textContent = el.getAttribute('data-mbu');
      // Label sits above the box, or inside it when the box touches the top of the screen.
      tag.style.cssText = `position:absolute;left:-2px;top:${r.top < 16 ? 0 : -16}px;background:#e11d48;color:#fff;` +
        'font:bold 12px/16px sans-serif;padding:0 4px;border-radius:3px';
      box.appendChild(tag);
      layer.appendChild(box);
    }
    document.documentElement.appendChild(layer);
  });
  try {
    return await page.screenshot({ type: 'jpeg', quality: 70 });
  } finally {
    await page.evaluate(() => document.getElementById('__mbu_labels')?.remove());
  }
}

const formatState = (s) =>
  `URL: ${s.url}\nTitle: ${s.title}\nElements:\n${s.elements.join('\n') || '(none in view)'}`;

module.exports = { toUrl, observePage, labelledScreenshot, formatState };
