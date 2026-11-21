// The Browser class: a Playwright page plus the actions and AI methods built on it.
const { chromium } = require('playwright');
const { toUrl, observePage, labelledScreenshot } = require('./page');
const { runAgent, runAct } = require('./agent');
const { runExtract } = require('./extract');

class Browser {
  /**
   * Launch a browser.
   * options: model ("provider:model-id" or an AI SDK model), headless, channel ("chrome", "msedge"),
   * viewport, screenshots (send screenshots to the model, default true), maxSteps, log (function).
   * Defaults come from the HEADED, BROWSER, MODEL and SCREENSHOTS environment variables.
   */
  static async launch(options = {}) {
    const {
      headless = !process.env.HEADED,
      channel = process.env.BROWSER,
      viewport = { width: 1280, height: 800 },
      screenshots = process.env.SCREENSHOTS !== '0',
      ...rest
    } = options;
    const browser = await chromium.launch({
      headless,
      ...(channel && channel !== 'chromium' ? { channel } : {}),
    });
    const page = await browser.newPage({ viewport });
    return new Browser(browser, page, { screenshots, ...rest });
  }

  constructor(browser, page, options = {}) {
    this.browser = browser;
    this.page = page; // the underlying Playwright page, for anything not wrapped here
    this.options = options;
  }

  // ---- Looking at the page
  /** Number the visible interactive elements. Returns { url, title, elements: ["[0] <button> OK", ...] }. */
  observe() { return observePage(this.page); }
  /** Visible page text. */
  async text(max = 8000) { return (await this.page.innerText('body')).slice(0, max); }
  /** JPEG of the page with the numbered elements outlined. */
  async screenshot() { await this.observe(); return labelledScreenshot(this.page); }

  // ---- Direct actions. Element numbers refer to the most recent observe().
  async goto(url) { await this.page.goto(toUrl(url), { waitUntil: 'domcontentloaded' }); await this.settle(); }
  async click(n) { await (await this.element(n)).click({ timeout: 5000 }); await this.settle(); }
  async type(n, text) { await (await this.element(n)).fill(String(text), { timeout: 5000 }); await this.settle(); }
  async press(key) { await this.page.keyboard.press(key); await this.settle(); }
  async select(n, value) { await (await this.element(n)).selectOption(String(value), { timeout: 5000 }); await this.settle(); }
  async scroll(direction = 'down') { await this.page.mouse.wheel(0, direction === 'up' ? -600 : 600); await this.settle(); }
  async back() { await this.page.goBack(); await this.settle(); }

  // ---- AI methods. Each takes optional overrides of the launch options (model, maxSteps, ...).
  /** Work toward a goal on its own. Returns { success, answer, steps, actions }. */
  agent(goal, options = {}) { return runAgent(this, goal, { ...this.options, ...options }); }
  /** Carry out one instruction, e.g. "click the login button". Returns { success, answer, steps, actions }. */
  act(instruction, options = {}) { return runAct(this, instruction, { ...this.options, ...options }); }
  /** Read data off the page. With a zod schema returns a typed object; without one, a string. */
  extract(instruction, schema, options = {}) {
    return runExtract(this, instruction, schema, { ...this.options, ...options });
  }

  close() { return this.browser.close(); }

  // ---- Internals
  async element(n) {
    const locator = this.page.locator(`[data-mbu="${n}"]`);
    if ((await locator.count()) === 0) {
      throw new Error(`No element ${n} on the page. Use a number from the latest element list.`);
    }
    return locator;
  }
  // Give the page a moment to react (navigate, re-render) before the next observe.
  async settle() {
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForTimeout(300);
  }
}

module.exports = { Browser };
