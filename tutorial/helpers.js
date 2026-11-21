// Small helpers shared by the tutorial scripts, so each script can focus on its one idea.
// Chapter 4 explains everything in here.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

// Read settings like BROWSER and ANTHROPIC_API_KEY from the project's .env file, if there is one.
try { process.loadEnvFile(path.join(__dirname, '..', '.env')); } catch {}

// Start a browser. BROWSER=chrome or BROWSER=msedge uses the one installed on your computer;
// otherwise Playwright's own Chromium. HEADED=1 shows the window.
async function launch() {
  const channel = ['chrome', 'msedge'].includes(process.env.BROWSER) ? process.env.BROWSER : undefined;
  const browser = await chromium.launch({ headless: !process.env.HEADED, channel });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  return { browser, page };
}

// The practice page every chapter uses, as a file:// address the browser can open.
const PRACTICE_PAGE = 'file://' + path.resolve(__dirname, '..', 'test.html').replace(/\\/g, '/').replace(/^\/?/, '/');

// Where scripts save screenshots.
const OUTPUT = path.join(__dirname, 'output');
fs.mkdirSync(OUTPUT, { recursive: true });

module.exports = { launch, PRACTICE_PAGE, OUTPUT };
