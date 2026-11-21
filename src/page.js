// Code that runs inside the web page. frame.evaluate() ships each function to the
// browser as text, runs it there, and sends the return value back as JSON.
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// Accept a URL, a bare domain, or a path to a local file (works on Windows too).
function toUrl(target) {
  if (fs.existsSync(target)) return pathToFileURL(path.resolve(target)).href;
  return /^[a-z][a-z0-9+.-]*:/i.test(target) ? target : 'https://' + target;
}

// Runs inside one frame. Numbers its visible interactive elements from `start`, writes each
// number onto the element as data-mbu (so actions can find it again), and returns a line of
// text plus an on-screen box per element. Looks inside open shadow roots, which
// document.querySelectorAll alone does not.
function scanFrame({ start, offset, viewport, clearOnly }) {
  const SEL = 'a[href],button,input,textarea,select,summary,[role=button],[role=link],' +
    '[role=tab],[role=checkbox],[role=menuitem],[onclick],[contenteditable=true],[tabindex]:not([tabindex="-1"])';

  // Every element in document order; a shadow root's contents come right after its host.
  /** @type {any[]} */
  const all = [];
  const walk = (root) => {
    for (const el of Array.from(root.querySelectorAll('*'))) {
      all.push(el);
      if (el.shadowRoot) walk(el.shadowRoot);
    }
  };
  walk(document);
  for (const el of all) if (el.hasAttribute('data-mbu')) el.removeAttribute('data-mbu');
  if (clearOnly) return [];

  const clean = (t) => (t || '').trim().replace(/\s+/g, ' ');
  const out = [];
  for (const el of all) {
    if (!el.matches(SEL) || el.disabled) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
    // Must be on screen in its own frame, and that part of the frame must be on screen too.
    const inFrame = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    const x = r.left + offset.x;
    const y = r.top + offset.y;
    const onScreen = y + r.height > 0 && y < viewport.height && x + r.width > 0 && x < viewport.width;
    if (!inFrame || !onScreen) continue;

    const id = start + out.length;
    el.setAttribute('data-mbu', String(id));
    const tag = el.tagName.toLowerCase();
    let label = clean(el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') ||
      el.title || el.name).slice(0, 60);
    let extra = tag === 'input' ? ` type=${el.type}`
      : tag === 'a' ? ` -> ${(el.getAttribute('href') || '').slice(0, 50)}` : '';
    if (tag === 'select') { // show the current choice, then every option
      label = clean(el.options[el.selectedIndex]?.text);
      extra = ` options=[${Array.from(el.options).map((o) => clean(/** @type {any} */ (o).text)).join(' | ')}]`.slice(0, 150);
    }
    out.push({ line: `<${tag}${extra}> ${label}`, box: { id, x, y, width: r.width, height: r.height } });
  }
  return out;
}

// OBSERVE: scan the page and every visible iframe, numbering elements across all of them.
// Returns { url, title, elements: ["[0] <button> OK", ...], boxes: [{ id, x, y, width, height }] }.
async function observePage(page) {
  const viewport = page.viewportSize() || { width: 1280, height: 800 };
  const items = [];
  for (const frame of page.frames()) {
    let offset = { x: 0, y: 0 };
    let where = '';
    if (frame !== page.mainFrame()) {
      // Where the iframe sits on screen; frames that are hidden or gone are skipped.
      const handle = await frame.frameElement().catch(() => null);
      const box = handle && (await handle.boundingBox().catch(() => null));
      if (!box) {
        await frame.evaluate(scanFrame, { start: 0, offset, viewport, clearOnly: true }).catch(() => {});
        continue;
      }
      offset = { x: box.x, y: box.y };
      where = ' (in frame)';
    }
    try {
      const found = await frame.evaluate(scanFrame, { start: items.length, offset, viewport, clearOnly: false });
      for (const f of found) items.push({ line: `[${f.box.id}] ${f.line}${where}`, box: f.box });
    } catch {
      // The frame navigated or closed while we were reading it; it will show up next time.
    }
  }
  return {
    url: page.url(),
    title: await page.title(),
    elements: items.map((i) => i.line),
    boxes: items.map((i) => i.box),
  };
}

// Screenshot with each numbered element outlined and tagged, so the picture matches the list.
// `boxes` come from observePage(). Returns a JPEG buffer.
async function labelledScreenshot(page, boxes) {
  await page.evaluate((list) => {
    const layer = document.createElement('div');
    layer.id = '__mbu_labels';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647';
    for (const b of list) {
      const box = document.createElement('div');
      box.style.cssText = `position:fixed;left:${b.x}px;top:${b.y}px;width:${b.width}px;height:${b.height}px;` +
        'outline:2px solid #e11d48;box-sizing:border-box';
      const tag = document.createElement('span');
      tag.textContent = String(b.id);
      // Label sits above the box, or inside it when the box touches the top of the screen.
      tag.style.cssText = `position:absolute;left:-2px;top:${b.y < 16 ? 0 : -16}px;background:#e11d48;color:#fff;` +
        'font:bold 12px/16px sans-serif;padding:0 4px;border-radius:3px';
      box.appendChild(tag);
      layer.appendChild(box);
    }
    document.documentElement.appendChild(layer);
  }, boxes);
  try {
    return await page.screenshot({ type: 'jpeg', quality: 70 });
  } finally {
    await page.evaluate(() => document.getElementById('__mbu_labels')?.remove());
  }
}

const formatState = (s) =>
  `URL: ${s.url}\nTitle: ${s.title}\nElements:\n${s.elements.join('\n') || '(none in view)'}`;

// The element's description without its number, e.g. "<button> Greet". Used to recognise
// the same element again after the numbers have changed.
const describe = (line) => (line || '').replace(/^\[\d+\] /, '');

module.exports = { toUrl, observePage, labelledScreenshot, formatState, describe };
