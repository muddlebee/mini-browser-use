// Chapter 9: the whole idea in one file. Observe, let the model decide, act, repeat.
//   node tutorial/07-tiny-agent.js             (needs an API key in .env, see docs/setup.md)
const { generateText, tool } = require('ai');
const { z } = require('zod');
const { resolveModel } = require('../src/model');
const { launch, PRACTICE_PAGE } = require('./helpers');

// OBSERVE: number the visible interactive elements (chapter 6) and describe the page as text.
async function observe(page) {
  const lines = await page.evaluate(() => {
    const out = [];
    for (const el of Array.from(document.querySelectorAll('a[href], button, input, textarea, select'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      el.setAttribute('data-mbu', String(out.length));
      out.push(`[${out.length}] <${el.tagName.toLowerCase()}> ${(el.innerText || el.value || el.placeholder || '').trim()}`);
    }
    return out;
  });
  const text = await page.evaluate(() => document.body.innerText);
  return `Elements:\n${lines.join('\n')}\n\nVisible text:\n${text}`;
}

(async () => {
  const { browser, page } = await launch();
  await page.goto(PRACTICE_PAGE);

  // ACT: tools the model can use. This time each has an execute function, so the SDK runs it,
  // and whatever it returns (the new page state) goes back to the model.
  const tools = {
    click: tool({
      description: 'Click an element.',
      inputSchema: z.object({ element: z.number() }),
      execute: async ({ element }) => {
        await page.locator(`[data-mbu="${element}"]`).click();
        return observe(page);
      },
    }),
    type: tool({
      description: 'Type text into a text box.',
      inputSchema: z.object({ element: z.number(), text: z.string() }),
      execute: async ({ element, text }) => {
        await page.locator(`[data-mbu="${element}"]`).fill(text);
        return observe(page);
      },
    }),
  };

  // The conversation so far. The model remembers nothing between calls, so we resend all of it.
  const messages = [{ role: 'user', content: `Goal: greet Ada and tell me what the page says.\n\n${await observe(page)}` }];

  for (let step = 1; step <= 10; step++) {
    // DECIDE (and the SDK runs any tools the model picked).
    const result = await generateText({ model: resolveModel(), messages, tools, toolCallConcurrency: 1 });
    for (const call of result.toolCalls) console.log(`step ${step}:`, call.toolName, JSON.stringify(call.input));
    messages.push(...result.responseMessages); // remember what happened

    if (result.toolCalls.length === 0) {       // no more actions: the model has answered
      console.log('\nAnswer:', result.text);
      break;
    }
  }
  await browser.close();
})();
