// The action menu the model chooses from. Each tool describes itself (description + zod
// schema) and carries the code that runs it; the AI SDK translates it for each provider.
const { tool } = require('ai');
const { z } = require('zod');
const { formatState } = require('./page');

function browserTools(browser, { log = () => {}, record = () => {} } = {}) {
  const n = z.number().int().describe('Element number from the latest page state');

  // Wrap an action: run it, record it, and return the outcome plus the fresh page state.
  const action = (name, run) => async (input) => {
    log(`  ${name} ${JSON.stringify(input)}`);
    let outcome;
    try {
      outcome = (await run(input)) ?? 'ok';
      record({ action: name, input, ok: true });
    } catch (e) {
      const error = e.message.split('\n')[0];
      outcome = `Action failed: ${error}`; // the model sees this and can try something else
      record({ action: name, input, ok: false, error });
    }
    return `${outcome}\n\n${formatState(await browser.observe())}`;
  };

  return {
    goto: tool({
      description: 'Navigate to a URL.',
      inputSchema: z.object({ url: z.string() }),
      execute: action('goto', ({ url }) => browser.goto(url)),
    }),
    click: tool({
      description: 'Click an element.',
      inputSchema: z.object({ element: n }),
      execute: action('click', ({ element }) => browser.click(element)),
    }),
    type: tool({
      description: 'Replace the contents of a text field. Does not submit; use press Enter or click a button.',
      inputSchema: z.object({ element: n, text: z.string() }),
      execute: action('type', ({ element, text }) => browser.type(element, text)),
    }),
    press: tool({
      description: 'Press a keyboard key, e.g. Enter, Tab, Escape.',
      inputSchema: z.object({ key: z.string() }),
      execute: action('press', ({ key }) => browser.press(key)),
    }),
    select: tool({
      description: 'Choose an option in a <select> dropdown by its value or label.',
      inputSchema: z.object({ element: n, value: z.string() }),
      execute: action('select', ({ element, value }) => browser.select(element, value)),
    }),
    scroll: tool({
      description: 'Scroll the page to reveal more elements.',
      inputSchema: z.object({ direction: z.enum(['up', 'down']) }),
      execute: action('scroll', ({ direction }) => browser.scroll(direction)),
    }),
    back: tool({
      description: 'Go back one page in history.',
      inputSchema: z.object({}),
      execute: action('back', () => browser.back()),
    }),
    read: tool({
      description: 'Return the visible text of the page. Use this to read content; the element list only shows controls.',
      inputSchema: z.object({}),
      execute: action('read', () => browser.text()),
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

module.exports = { browserTools };
