// The action menu the model chooses from. Each tool describes itself (description + zod
// schema) and carries the code that runs it; the AI SDK translates it for each provider.
const { tool } = require('ai');
const { z } = require('zod');
const { formatState } = require('./page');

// What each action does. Shared by the tools below and by act()'s cache replay.
const ACTIONS = {
  goto: (b, i) => b.goto(i.url),
  click: (b, i) => b.click(i.element),
  type: (b, i) => b.type(i.element, i.text),
  press: (b, i) => b.press(i.key),
  select: (b, i) => b.select(i.element, i.value),
  scroll: (b, i) => b.scroll(i.direction),
  back: (b) => b.back(),
  read: (b) => b.text(),
};

/**
 * @param {import('./browser').Browser} browser
 * @param {{ log?: (message: string) => void, record?: (action: object) => void }} [hooks]
 */
function browserTools(browser, { log = () => {}, record = () => {} } = {}) {
  const n = z.number().int().describe('Element number from the latest page state');

  // Wrap an action: run it, record it, and return the outcome plus the fresh page state.
  const run = (name) => async (input) => {
    log(`  ${name} ${JSON.stringify(input)}`);
    // Remember which element this was by description, so act()'s cache can find it again.
    const target = input.element === undefined ? undefined : browser.describe(input.element);
    const occurrence = target === undefined ? undefined : sameBefore(browser, input.element, target);
    let outcome;
    try {
      outcome = (await ACTIONS[name](browser, input)) ?? 'ok';
      record({ action: name, input, target, occurrence, ok: true });
    } catch (e) {
      const error = e.message.split('\n')[0];
      outcome = `Action failed: ${error}`; // the model sees this and can try something else
      record({ action: name, input, target, occurrence, ok: false, error });
    }
    return `${outcome}\n\n${formatState(await browser.observe())}`;
  };

  return {
    goto: tool({ description: 'Navigate to a URL.', inputSchema: z.object({ url: z.string() }), execute: run('goto') }),
    click: tool({ description: 'Click an element.', inputSchema: z.object({ element: n }), execute: run('click') }),
    type: tool({
      description: 'Replace the contents of a text field. Does not submit; use press Enter or click a button.',
      inputSchema: z.object({ element: n, text: z.string() }),
      execute: run('type'),
    }),
    press: tool({
      description: 'Press a keyboard key, e.g. Enter, Tab, Escape.',
      inputSchema: z.object({ key: z.string() }),
      execute: run('press'),
    }),
    select: tool({
      description: 'Choose an option in a <select> dropdown by its value or label.',
      inputSchema: z.object({ element: n, value: z.string() }),
      execute: run('select'),
    }),
    scroll: tool({
      description: 'Scroll the page to reveal more elements.',
      inputSchema: z.object({ direction: z.enum(['up', 'down']) }),
      execute: run('scroll'),
    }),
    back: tool({ description: 'Go back one page in history.', inputSchema: z.object({}), execute: run('back') }),
    read: tool({
      description: 'Return the visible text of the page. Use this to read content; the element list only shows controls.',
      inputSchema: z.object({}),
      execute: run('read'),
    }),
    // No execute: when the model calls done, the loop stops and returns its input.
    done: tool({
      description: 'Finish. Call this once the task is complete, or when it cannot be completed.',
      inputSchema: z.object({
        success: z.boolean().describe('Whether the task was completed'),
        answer: z.string().describe('The answer, or what was done, or why it could not be done'),
      }),
    }),
  };
}

// How many earlier elements have the same description (to tell apart several "Add to cart" buttons).
function sameBefore(browser, n, target) {
  const lines = browser.lastState?.elements || [];
  const index = lines.findIndex((l) => l.startsWith(`[${n}] `));
  return lines.slice(0, Math.max(index, 0)).filter((l) => l.replace(/^\[\d+\] /, '') === target).length;
}

module.exports = { browserTools, ACTIONS };
