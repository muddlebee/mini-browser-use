#!/usr/bin/env node
// The same observe -> decide -> act loop as agent.js, but Claude decides.
//   node llm-agent.js "<goal>" [start-url]
const Anthropic = require('@anthropic-ai/sdk');
const { observe, actions, launchBrowser, labelledScreenshot } = require('./agent.js');

const MODEL = 'claude-opus-5-5';
const MAX_STEPS = 25;
// Screenshots on by default; SCREENSHOTS=0 sends only the text element list (cheaper).
const SCREENSHOTS = process.env.SCREENSHOTS !== '0';

const SYSTEM = `You operate a web browser to complete the user's goal.
Every tool result ends with the current page: its URL, title, and a numbered list of the interactive
elements in view, usually followed by a screenshot of the visible page with each element outlined in red
and labelled with its number. Use the screenshot to understand layout, images and anything the list misses;
act through element numbers. Numbers are reassigned after every action, so only ever use numbers from the
most recent page state. Elements below the fold are not listed until you scroll.
When the goal is complete, or you find it cannot be done, stop calling tools and reply with the answer.`;

// ---- The action menu, described so the model can choose from it.
// Each tool name matches a key in `actions`; `args` turns the model's JSON into that function's arguments.
const n = { type: 'integer', description: 'Element number from the latest page state' };
const TOOLS = [
  { name: 'goto',   description: 'Navigate to a URL.',
    props: { url: { type: 'string' } },                    args: (i) => [i.url] },
  { name: 'click',  description: 'Click an element.',
    props: { element: n },                                 args: (i) => [i.element] },
  { name: 'type',   description: 'Replace the contents of a text field. Does not submit; use press Enter or click a button.',
    props: { element: n, text: { type: 'string' } },       args: (i) => [i.element, i.text] },
  { name: 'press',  description: 'Press a keyboard key, e.g. Enter, Tab, Escape.',
    props: { key: { type: 'string' } },                    args: (i) => [i.key] },
  { name: 'select', description: 'Choose an option in a <select> dropdown by its value or label.',
    props: { element: n, value: { type: 'string' } },      args: (i) => [i.element, i.value] },
  { name: 'scroll', description: 'Scroll the page to reveal more elements.',
    props: { direction: { type: 'string', enum: ['up', 'down'] } }, args: (i) => [i.direction] },
  { name: 'back',   description: 'Go back one page in history.',
    props: {},                                             args: () => [] },
  { name: 'read',   description: 'Return the visible text of the page. Use this to read content; the element list only shows controls.',
    props: {},                                             args: () => [] },
];
const toolDefs = TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: { type: 'object', properties: t.props, required: Object.keys(t.props), additionalProperties: false },
}));

const formatState = (s) =>
  `URL: ${s.url}\nTitle: ${s.title}\nElements:\n${s.elements.join('\n') || '(none in view)'}`;

// OBSERVE: the page as content blocks: the element list as text, plus a labelled screenshot.
async function pageState(page, { withScreenshot = SCREENSHOTS } = {}) {
  const blocks = [{ type: 'text', text: formatState(await observe(page)) }];
  if (withScreenshot) {
    const jpeg = await labelledScreenshot(page);
    blocks.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpeg.toString('base64') } });
  }
  return blocks;
}

// ---- ACT: run one tool call from the model, return what happened plus the new page state
async function execute(page, call, { withScreenshot }) {
  const tool = TOOLS.find((t) => t.name === call.name);
  let outcome, failed = false;
  try {
    if (!tool) throw new Error(`unknown tool ${call.name}`);
    if (call.name === 'read') {
      outcome = (await page.innerText('body')).slice(0, 8000);
    } else {
      await actions[call.name](page, ...tool.args(call.input));
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(300);
      outcome = 'ok';
    }
  } catch (e) {
    failed = true; // the model sees the error and can try something else
    outcome = `Action failed: ${e.message.split('\n')[0]}`;
  }
  return {
    type: 'tool_result',
    tool_use_id: call.id,
    is_error: failed,
    content: [{ type: 'text', text: outcome }, ...(await pageState(page, { withScreenshot }))],
  };
}

// ---- THE LOOP
async function run(goal, { page, client, log = console.log }) {
  // The whole conversation is resent every step: that is the agent's only memory.
  const messages = [{ role: 'user', content: [{ type: 'text', text: `Goal: ${goal}` }, ...(await pageState(page))] }];

  for (let step = 1; step <= MAX_STEPS; step++) {
    // DECIDE
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      tools: toolDefs,
      messages,
      // Cache the conversation so each step only pays full price for what is new since the last one.
      cache_control: { type: 'ephemeral' },
      // If a safety classifier declines the request, the API reruns it on a fallback model.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    messages.push({ role: 'assistant', content: response.content }); // keep every block, not just text

    for (const b of response.content) if (b.type === 'text' && b.text.trim()) log(`claude: ${b.text.trim()}`);
    const calls = response.content.filter((b) => b.type === 'tool_use');

    if (response.stop_reason !== 'tool_use') {
      if (response.stop_reason !== 'end_turn') log(`stopped early: ${response.stop_reason}`);
      return response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    }

    // ACT, one call at a time: each action changes the page and renumbers the elements.
    // Only the last result gets a screenshot: that is the page Claude acts on next.
    const results = [];
    for (const [i, call] of calls.entries()) {
      log(`step ${step}: ${call.name} ${JSON.stringify(call.input)}`);
      const last = i === calls.length - 1;
      results.push(await execute(page, call, { withScreenshot: SCREENSHOTS && last }));
    }
    messages.push({ role: 'user', content: results }); // all results go back in one message
  }
  return `Gave up after ${MAX_STEPS} steps.`;
}

module.exports = { run };

if (require.main === module) (async () => {
  const [goal, startUrl] = process.argv.slice(2);
  if (!goal) { console.error('usage: node llm-agent.js "<goal>" [start-url]'); process.exit(1); }
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  if (startUrl) await actions.goto(page, startUrl);
  try {
    const answer = await run(goal, { page, client: new Anthropic() });
    console.log(`\nRESULT: ${answer}`);
  } finally {
    await browser.close();
  }
})();
