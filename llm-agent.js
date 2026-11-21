#!/usr/bin/env node
// The same observe -> decide -> act loop as agent.js, but an LLM decides.
// Works with any provider the Vercel AI SDK supports; pick one with MODEL=<provider>:<model-id>.
//   node llm-agent.js "<goal>" [start-url]
const { generateText, tool, createProviderRegistry } = require('ai');
const { anthropic } = require('@ai-sdk/anthropic');
const { openai } = require('@ai-sdk/openai');
const { google } = require('@ai-sdk/google');
const { createOpenAICompatible } = require('@ai-sdk/openai-compatible');
const { z } = require('zod');
const { observe, actions, launchBrowser, labelledScreenshot } = require('./agent.js'); // also loads .env

const MAX_STEPS = 25;
// Screenshots on by default; SCREENSHOTS=0 sends only the text element list
// (cheaper, and needed for models that cannot read images).
const SCREENSHOTS = process.env.SCREENSHOTS !== '0';

// ---- Pick the model. Each provider reads its own API key from the environment:
// ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY.
// "custom" is any OpenAI-compatible server (OpenRouter, Ollama, LM Studio, Groq, ...).
const providers = { anthropic, openai, google };
if (process.env.CUSTOM_BASE_URL) {
  providers.custom = createOpenAICompatible({
    name: 'custom',
    baseURL: process.env.CUSTOM_BASE_URL,
    apiKey: process.env.CUSTOM_API_KEY,
  });
}
const registry = createProviderRegistry(providers);
const MODEL = process.env.MODEL || 'anthropic:claude-opus-5-5';

const INSTRUCTIONS = `You operate a web browser to complete the user's goal.
After every action you get the current page: its URL, title, and a numbered list of the interactive
elements in view. Usually a screenshot follows, with each element outlined in red and labelled with its
number. Use the screenshot to understand layout, images and anything the list misses; act through element
numbers. Numbers are reassigned after every action, so only ever use numbers from the most recent page
state. Elements below the fold are not listed until you scroll.
When the goal is complete, or you find it cannot be done, stop calling tools and reply with the answer.`;

const formatState = (s) =>
  `URL: ${s.url}\nTitle: ${s.title}\nElements:\n${s.elements.join('\n') || '(none in view)'}`;

// The screenshot goes in its own user message, not inside the tool result:
// every vision model accepts images from the user, but not every provider accepts them in tool results.
async function screenshotMessage(page) {
  const jpeg = await labelledScreenshot(page);
  return {
    role: 'user',
    content: [
      { type: 'text', text: 'Screenshot of the current page:' },
      { type: 'file', mediaType: 'image/jpeg', data: { type: 'data', data: jpeg.toString('base64') } },
    ],
  };
}

// ---- The action menu. Each tool describes itself to the model (description + zod schema)
// and carries the code that runs it (execute). The SDK translates this into each provider's format.
function browserTools(page, log) {
  const n = z.number().int().describe('Element number from the latest page state');
  const act = (name, run) => async (input) => {
    log(`  ${name} ${JSON.stringify(input)}`);
    let outcome;
    try {
      outcome = (await run(input)) ?? 'ok';
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(300);
    } catch (e) {
      outcome = `Action failed: ${e.message.split('\n')[0]}`; // the model sees this and can try something else
    }
    return `${outcome}\n\n${formatState(await observe(page))}`;
  };
  return {
    goto: tool({
      description: 'Navigate to a URL.',
      inputSchema: z.object({ url: z.string() }),
      execute: act('goto', ({ url }) => actions.goto(page, url).then(() => {})),
    }),
    click: tool({
      description: 'Click an element.',
      inputSchema: z.object({ element: n }),
      execute: act('click', ({ element }) => actions.click(page, element)),
    }),
    type: tool({
      description: 'Replace the contents of a text field. Does not submit; use press Enter or click a button.',
      inputSchema: z.object({ element: n, text: z.string() }),
      execute: act('type', ({ element, text }) => actions.type(page, element, text)),
    }),
    press: tool({
      description: 'Press a keyboard key, e.g. Enter, Tab, Escape.',
      inputSchema: z.object({ key: z.string() }),
      execute: act('press', ({ key }) => actions.press(page, key)),
    }),
    select: tool({
      description: 'Choose an option in a <select> dropdown by its value or label.',
      inputSchema: z.object({ element: n, value: z.string() }),
      execute: act('select', ({ element, value }) => actions.select(page, element, value).then(() => {})),
    }),
    scroll: tool({
      description: 'Scroll the page to reveal more elements.',
      inputSchema: z.object({ direction: z.enum(['up', 'down']) }),
      execute: act('scroll', ({ direction }) => actions.scroll(page, direction)),
    }),
    back: tool({
      description: 'Go back one page in history.',
      inputSchema: z.object({}),
      execute: act('back', () => actions.back(page).then(() => {})),
    }),
    read: tool({
      description: 'Return the visible text of the page. Use this to read content; the element list only shows controls.',
      inputSchema: z.object({}),
      execute: act('read', async () => (await page.innerText('body')).slice(0, 8000)),
    }),
  };
}

// ---- THE LOOP
async function run(goal, { page, model = registry.languageModel(MODEL), log = console.log }) {
  const tools = browserTools(page, log);

  // The whole conversation is resent every step: it is the agent's only memory.
  const messages = [{ role: 'user', content: `Goal: ${goal}\n\n${formatState(await observe(page))}` }];
  if (SCREENSHOTS) messages.push(await screenshotMessage(page));

  for (let step = 1; step <= MAX_STEPS; step++) {
    // DECIDE and ACT: one model call; the SDK runs any tools it asks for and returns
    // the model's reply plus the tool results, already in the right message format.
    const result = await generateText({
      model,
      instructions: INSTRUCTIONS,
      messages,
      tools,
      toolCallConcurrency: 1, // one browser action at a time: each changes the page
    });
    if (result.text.trim()) log(`model: ${result.text.trim()}`);
    messages.push(...result.responseMessages);

    if (result.toolCalls.length === 0) return result.text; // no more actions: this is the answer

    log(`step ${step} done`);
    if (SCREENSHOTS) messages.push(await screenshotMessage(page)); // OBSERVE the new page
  }
  return `Gave up after ${MAX_STEPS} steps.`;
}

module.exports = { run };

if (require.main === module) (async () => {
  const [goal, startUrl] = process.argv.slice(2);
  if (!goal) { console.error('usage: node llm-agent.js "<goal>" [start-url]'); process.exit(1); }
  console.log(`model: ${MODEL}`);
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  if (startUrl) await actions.goto(page, startUrl);
  try {
    const answer = await run(goal, { page });
    console.log(`\nRESULT: ${answer}`);
  } finally {
    await browser.close();
  }
})();
