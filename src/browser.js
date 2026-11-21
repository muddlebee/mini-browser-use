// The Browser class: a Playwright page plus the actions and AI methods built on it.
const { chromium } = require('playwright');
const { toUrl, observePage, labelledScreenshot, describe } = require('./page');
const { runAgent, runAct } = require('./agent');
const { runExtract } = require('./extract');
const { ActCache } = require('./cache');

// Clicks on elements matching this go through the `confirm` option first.
const RISKY = /\b(buy|pay|purchase|order|checkout|submit|delete|remove|send|confirm|subscribe|sign ?up|transfer|book)\b|type=submit/i;

class Browser {
  /**
   * Launch a browser. Every option is optional.
   * @param {object} [options]
   * @param {string | import('ai').LanguageModel} [options.model] "provider:model-id" or an AI SDK model. Default: MODEL env.
   * @param {boolean} [options.headless] Default: true unless HEADED is set.
   * @param {string} [options.channel] "chrome" or "msedge" to use an installed browser. Default: BROWSER env.
   * @param {{ width: number, height: number }} [options.viewport]
   * @param {boolean} [options.screenshots] Send labelled screenshots to the model. Default: true unless SCREENSHOTS=0.
   * @param {number} [options.maxSteps] Step limit for agent (default 25) and act (default 5).
   * @param {number} [options.historySteps] Start a fresh, summarised conversation after this many steps (default 10).
   * @param {(message: string) => void} [options.log] e.g. console.log to watch each step.
   * @param {string[]} [options.allowedDomains] Only these sites (and their subdomains) may be opened. Default: any.
   * @param {(action: { action: string, target: string }) => boolean | Promise<boolean>} [options.confirm]
   *   Asked before risky clicks (buy, pay, submit, delete, ...). Return false to block the click.
   * @param {boolean | string} [options.cache] Cache act() steps: true for memory, or a JSON file path.
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
    const instance = new Browser(browser, page, { screenshots, ...rest });
    await instance.guardNavigation();
    return instance;
  }

  constructor(browser, page, options = {}) {
    this.browser = browser;
    this.page = page; // the underlying Playwright page, for anything not wrapped here
    this.options = options;
    this.lastState = null; // the most recent observe(); element numbers refer to it
    this.blockedUrl = null;
    const { cache } = options;
    this.cache = cache ? new ActCache(typeof cache === 'string' ? cache : undefined) : null;
  }

  // ---- Looking at the page
  /** Number the visible interactive elements. Returns { url, title, elements: ["[0] <button> OK", ...], boxes }. */
  async observe() {
    this.lastState = await observePage(this.page);
    return this.lastState;
  }
  /** Visible page text. */
  async text(max = 8000) { return (await this.page.innerText('body')).slice(0, max); }
  /** JPEG of the page with the numbered elements outlined (observes first). */
  async screenshot() { await this.observe(); return this.labelledScreenshot(); }
  /** JPEG labelled from the last observe(), so the picture matches the list the model already has. */
  async labelledScreenshot() {
    if (!this.lastState) await this.observe();
    return labelledScreenshot(this.page, this.lastState.boxes);
  }
  /** Description of element n from the last observe(), e.g. "<button> Greet". */
  describe(n) { return describe(this.lastState?.elements.find((l) => l.startsWith(`[${n}] `))); }

  // ---- Direct actions. Element numbers refer to the most recent observe().
  async goto(url) {
    const target = toUrl(url);
    if (!this.isAllowed(target)) throw new Error(`Blocked: ${new URL(target).hostname} is not in allowedDomains.`);
    await this.page.goto(target, { waitUntil: 'domcontentloaded' });
    await this.settle();
  }
  async click(n) {
    const locator = await this.element(n);
    await this.checkRisky('click', n);
    await locator.click({ timeout: 5000 });
    await this.settle();
  }
  async type(n, text) { await (await this.element(n)).fill(String(text), { timeout: 5000 }); await this.settle(); }
  async press(key) { await this.page.keyboard.press(key); await this.settle(); }
  async select(n, value) { await (await this.element(n)).selectOption(String(value), { timeout: 5000 }); await this.settle(); }
  async scroll(direction = 'down') { await this.page.mouse.wheel(0, direction === 'up' ? -600 : 600); await this.settle(); }
  async back() { await this.page.goBack(); await this.settle(); }

  // ---- AI methods. Each takes optional overrides of the launch options (model, maxSteps, ...).
  /** Work toward a goal on its own. Returns { success, answer, steps, actions }. */
  agent(goal, options = {}) { return runAgent(this, goal, { ...this.options, ...options }); }
  /** Carry out one instruction, e.g. "click the login button". Returns { success, answer, steps, actions, cached }. */
  act(instruction, options = {}) { return runAct(this, instruction, { ...this.options, ...options }); }
  /** Read data off the page. With a zod schema returns a typed object; without one, a string. */
  extract(instruction, schema, options = {}) {
    return runExtract(this, instruction, schema, { ...this.options, ...options });
  }

  close() { return this.browser.close(); }

  // ---- Internals
  // Find element n in the page or in any iframe. Playwright's CSS lookup also enters open shadow roots.
  async element(n) {
    for (const frame of this.page.frames()) {
      const locator = frame.locator(`[data-mbu="${n}"]`);
      if ((await locator.count().catch(() => 0)) > 0) return locator;
    }
    throw new Error(`No element ${n} on the page. Use a number from the latest element list.`);
  }

  async checkRisky(action, n) {
    const { confirm } = this.options;
    const target = this.describe(n);
    if (!confirm || !RISKY.test(target)) return;
    if (!(await confirm({ action, target }))) {
      throw new Error(`The user declined: ${action} ${target}. Do not try to do this another way.`);
    }
  }

  isAllowed(url) {
    const { allowedDomains } = this.options;
    if (!allowedDomains?.length) return true;
    let u;
    try { u = new URL(url); } catch { return false; }
    if (!/^https?:$/.test(u.protocol)) return true; // local files, about:blank, data: URLs
    return allowedDomains.some((d) => u.hostname === d || u.hostname.endsWith(`.${d}`));
  }

  // Stop links, redirects and scripts from navigating to sites outside allowedDomains.
  async guardNavigation() {
    if (!this.options.allowedDomains?.length) return;
    await this.page.route('**/*', (route) => {
      const request = route.request();
      if (request.isNavigationRequest() && !this.isAllowed(request.url())) {
        this.blockedUrl = request.url();
        return route.abort('blockedbyclient');
      }
      return route.continue();
    });
  }

  // Give the page a moment to react (navigate, re-render) before the next observe,
  // and report a navigation the guard blocked during the action.
  async settle() {
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await this.page.waitForTimeout(300);
    if (this.blockedUrl) {
      const url = this.blockedUrl;
      this.blockedUrl = null;
      // Chrome shows its own error page for a blocked navigation; return to where we were.
      if (this.page.url().startsWith('chrome-error://')) {
        await this.page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
      }
      throw new Error(`Blocked: navigation to ${new URL(url).hostname} is not in allowedDomains.`);
    }
  }
}

module.exports = { Browser, RISKY };
