// The agent loop: observe -> ask the model -> run the actions it picks -> repeat.
// Shared by browser.agent() (open-ended goal) and browser.act() (one instruction).
const { generateText } = require('ai');
const { resolveModel } = require('./model');
const { browserTools } = require('./tools');
const { formatState, labelledScreenshot } = require('./page');

const BASE_INSTRUCTIONS = `You operate a web browser.
After every action you get the current page: its URL, title, and a numbered list of the interactive
elements in view. Usually a screenshot follows, with each element outlined in red and labelled with its
number. Use the screenshot to understand layout, images and anything the list misses; act through element
numbers. Numbers are reassigned after every action, so only ever use numbers from the most recent page
state. Elements below the fold are not listed until you scroll.`;

const AGENT_INSTRUCTIONS = `${BASE_INSTRUCTIONS}
Work toward the user's goal. When it is complete, or you find it cannot be done, call the done tool
with the answer.`;

const ACT_INSTRUCTIONS = `${BASE_INSTRUCTIONS}
Carry out exactly the user's instruction and nothing more; do not continue to further steps on your own.
Then call the done tool with a short description of what you did, or with success false if it cannot be done.`;

/**
 * @typedef {object} LoopOptions
 * @property {string} [instructions]
 * @property {string | import('ai').LanguageModel} [model]
 * @property {number} [maxSteps]
 * @property {boolean} [screenshots]
 * @property {(message: string) => void} [log]
 */

// The screenshot goes in its own user message, not inside a tool result:
// every vision model accepts images from the user, but not every provider accepts them in tool results.
/** @returns {Promise<import('ai').UserModelMessage>} */
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

/**
 * @param {import('./browser').Browser} browser
 * @param {string} task
 * @param {LoopOptions} options
 */
async function runLoop(browser, task, { instructions, model, maxSteps = 25, screenshots = true, log = () => {} }) {
  const llm = resolveModel(model);
  const actions = [];
  const tools = browserTools(browser, { log, record: (a) => actions.push(a) });
  const finish = (success, answer, steps) => ({ success, answer, steps, actions });

  // The whole conversation is resent every step: it is the agent's only memory.
  /** @type {import('ai').ModelMessage[]} */
  const messages = [{ role: 'user', content: `${task}\n\n${formatState(await browser.observe())}` }];
  if (screenshots) messages.push(await screenshotMessage(browser.page));

  for (let step = 1; step <= maxSteps; step++) {
    // DECIDE and ACT: one model call; the SDK runs the tools it asks for, one at a time.
    const result = await generateText({
      model: llm,
      instructions,
      messages,
      tools,
      toolCallConcurrency: 1, // each action changes the page, so never run two at once
    });
    if (result.text.trim()) log(`model: ${result.text.trim()}`);

    const done = result.toolCalls.find((c) => c.toolName === 'done');
    if (done) return finish(done.input.success, done.input.answer, step);
    // A model that answers in plain text instead of calling done is also finished.
    if (result.toolCalls.length === 0) return finish(true, result.text, step);

    messages.push(...result.responseMessages);
    if (screenshots) messages.push(await screenshotMessage(browser.page)); // OBSERVE the new page
  }
  return finish(false, `Gave up after ${maxSteps} steps.`, maxSteps);
}

/** @param {import('./browser').Browser} browser @param {string} goal @param {LoopOptions} [opts] */
const runAgent = (browser, goal, opts = {}) =>
  runLoop(browser, `Goal: ${goal}`, { instructions: AGENT_INSTRUCTIONS, ...opts });

/** @param {import('./browser').Browser} browser @param {string} instruction @param {LoopOptions} [opts] */
const runAct = (browser, instruction, opts = {}) =>
  runLoop(browser, `Instruction: ${instruction}`, { instructions: ACT_INSTRUCTIONS, maxSteps: 5, ...opts });

module.exports = { runAgent, runAct, screenshotMessage };
