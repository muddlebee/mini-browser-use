#!/usr/bin/env node
// mini browser-use: observe -> decide -> act, in a loop.
// The "decide" step is a pluggable driver. Here the driver is YOU (stdin).
const { chromium } = require('playwright');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// Load settings (ANTHROPIC_API_KEY, BROWSER, HEADED) from a .env file next to this script, if present.
// Variables already set in the shell win over the file.
try { process.loadEnvFile(path.join(__dirname, '.env')); } catch (e) { if (e.code !== 'ENOENT') throw e; }

// Accept a URL, a bare domain, or a path to a local file (works on Windows too).
function toUrl(target) {
  if (fs.existsSync(target)) return pathToFileURL(path.resolve(target)).href;
  return /^[a-z][a-z0-9+.-]*:/i.test(target) ? target : 'https://' + target;
}

// ---- 1. OBSERVE: turn the page into a short numbered list of things you can act on
async function observe(page) {
  const elements = await page.evaluate(() => {
    const SEL = 'a[href],button,input,textarea,select,summary,[role=button],[role=link],' +
      '[role=tab],[role=checkbox],[role=menuitem],[onclick],[contenteditable=true],[tabindex]:not([tabindex="-1"])';
    document.querySelectorAll('[data-mbu]').forEach(e => e.removeAttribute('data-mbu'));
    const out = [];
    for (const el of document.querySelectorAll(SEL)) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const visible = r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
      const inViewport = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      if (!visible || !inViewport || el.disabled) continue;
      const id = out.length;
      el.setAttribute('data-mbu', id); // the handle the ACT step uses later
      const tag = el.tagName.toLowerCase();
      const label = (el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') ||
        el.title || el.name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      const extra = tag === 'input' ? ` type=${el.type}` : tag === 'a' ? ` -> ${el.getAttribute('href').slice(0, 50)}` : '';
      out.push(`[${id}] <${tag}${extra}> ${label}`);
    }
    return out;
  });
  return { url: page.url(), title: await page.title(), elements };
}

// ---- 2. ACT: a tiny action vocabulary; each one maps to a Playwright call
const el = (page, i) => page.locator(`[data-mbu="${i}"]`);
const actions = {
  goto:   (page, url) => page.goto(toUrl(url), { waitUntil: 'domcontentloaded' }),
  click:  (page, i) => el(page, i).click({ timeout: 5000 }),
  type:   (page, i, ...words) => el(page, i).fill(words.join(' '), { timeout: 5000 }),
  press:  (page, key) => page.keyboard.press(key),            // Enter, Tab, Escape...
  select: (page, i, ...v) => el(page, i).selectOption(v.join(' ')),
  scroll: (page, dir = 'down') => page.mouse.wheel(0, dir === 'up' ? -600 : 600),
  back:   (page) => page.goBack(),
  text:   async (page) => console.log((await page.innerText('body')).slice(0, 3000)),
  shot:   async (page, file = 'shot.png') => { await page.screenshot({ path: file }); console.log('saved', file); },
};
const HELP = 'commands: goto <url> | click <n> | type <n> <text> | press <key> | select <n> <value> | ' +
  'scroll up|down | back | text | shot [file] | quit';

// ---- 3. DECIDE: a driver is just  async (state) => "command string"
// Swap this for an LLM call (send state as the prompt, parse the reply) and you have browser-use.
function humanDriver() {
  const rl = readline.createInterface({ input: process.stdin });
  const lines = rl[Symbol.asyncIterator]();
  return async (state) => {
    console.log(`\n== ${state.title} — ${state.url}`);
    console.log(state.elements.join('\n') || '(no interactive elements in view)');
    process.stdout.write('> ');
    const { value, done } = await lines.next();
    return done ? 'quit' : value;
  };
}

// BROWSER=chrome (or msedge) drives the browser installed on this machine
// instead of Playwright's bundled Chromium.
function launchBrowser() {
  const channel = process.env.BROWSER;
  return chromium.launch({
    headless: !process.env.HEADED,
    ...(channel && channel !== 'chromium' ? { channel } : {}),
  });
}

// ---- THE LOOP
module.exports = { observe, actions, launchBrowser };
if (require.main === module) (async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const decide = humanDriver();
  if (process.argv[2]) await actions.goto(page, process.argv[2]);
  console.log(HELP);
  while (true) {
    const state = await observe(page);
    const [cmd, ...args] = (await decide(state)).trim().split(/\s+/);
    if (cmd === 'quit' || cmd === 'exit') break;
    if (!actions[cmd]) { console.log(HELP); continue; }
    try {
      await actions[cmd](page, ...args);
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(300); // let the DOM settle before re-observing
    } catch (e) {
      console.log('! action failed:', e.message.split('\n')[0]); // errors are feedback, not crashes
    }
  }
  await browser.close();
})();
