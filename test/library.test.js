// Run with: npm test   (no API key needed: the model is a scripted fake)
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { MockLanguageModelV4 } = require('ai/test');
const { Browser, z } = require('../src');

const GREET = path.join(__dirname, '..', 'test.html');
let browser;

before(async () => { browser = await Browser.launch({ headless: true }); });
after(async () => { await browser?.close(); });

// A fake model that returns the given replies in order and records every prompt it received.
const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};
const call = (id, toolName, input) => ({ type: 'tool-call', toolCallId: id, toolName, input: JSON.stringify(input) });
function scriptedModel(replies) {
  const prompts = [];
  const model = new MockLanguageModelV4({
    doGenerate: async (options) => {
      prompts.push(options.prompt);
      const content = replies[prompts.length - 1];
      if (!content) throw new Error('scripted model ran out of replies');
      const unified = content.some((p) => p.type === 'tool-call') ? 'tool-calls' : 'stop';
      return { content, finishReason: { unified, raw: undefined }, usage, warnings: [] };
    },
  });
  return { model, prompts };
}

test('observe numbers visible elements and skips hidden ones', async () => {
  await browser.goto(GREET);
  const state = await browser.observe();
  assert.deepEqual(state.elements, [
    '[0] <input type=text> Your name',
    '[1] <button> Greet',
    '[2] <a -> https://example.com> Example',
  ]);
  assert.equal(state.title, 'Test');
});

test('direct actions work by element number', async () => {
  await browser.goto(GREET);
  await browser.observe();
  await browser.type(0, 'Grace');
  await browser.click(1);
  assert.match(await browser.text(), /Hello Grace/);
});

test('screenshot returns a JPEG and removes the label overlay', async () => {
  await browser.goto(GREET);
  const jpeg = await browser.screenshot();
  assert.equal(jpeg[0], 0xff);
  assert.equal(jpeg[1], 0xd8);
  assert.equal(await browser.page.evaluate(() => !!document.getElementById('__mbu_labels')), false);
});

test('agent runs tools in order, feeds back errors, and stops on done', async () => {
  await browser.goto(GREET);
  const { model, prompts } = scriptedModel([
    [call('a', 'type', { element: 0, text: 'Ada' }), call('b', 'click', { element: 1 })],
    [call('c', 'click', { element: 42 })],
    [call('d', 'done', { success: true, answer: 'Hello Ada' })],
  ]);
  const result = await browser.agent('greet Ada', { model });

  assert.deepEqual(
    { success: result.success, answer: result.answer, steps: result.steps },
    { success: true, answer: 'Hello Ada', steps: 3 },
  );
  assert.deepEqual(result.actions.map((a) => [a.action, a.ok]), [['type', true], ['click', true], ['click', false]]);
  assert.match(await browser.text(), /Hello Ada/);

  // The failed click was reported back to the model, and every step got a fresh screenshot.
  const last = prompts.at(-1);
  const toolOutputs = last.filter((m) => m.role === 'tool').flatMap((m) => m.content).map((p) => p.output.value);
  assert.match(toolOutputs.at(-1), /^Action failed: No element 42/);
  const images = last.flatMap((m) => (Array.isArray(m.content) ? m.content : [])).filter((p) => p.type === 'file');
  assert.equal(images.length, 3);
});

test('agent accepts a plain-text answer and respects maxSteps', async () => {
  await browser.goto(GREET);
  const plain = scriptedModel([[{ type: 'text', text: 'Nothing to do.' }]]);
  const r1 = await browser.agent('look around', { model: plain.model });
  assert.deepEqual([r1.success, r1.answer, r1.steps], [true, 'Nothing to do.', 1]);

  const looping = scriptedModel(Array.from({ length: 3 }, (_, i) => [call(`s${i}`, 'scroll', { direction: 'down' })]));
  const r2 = await browser.agent('scroll forever', { model: looping.model, maxSteps: 3 });
  assert.deepEqual([r2.success, r2.steps], [false, 3]);
});

test('screenshots: false sends no images', async () => {
  await browser.goto(GREET);
  const { model, prompts } = scriptedModel([[call('x', 'done', { success: true, answer: 'ok' })]]);
  await browser.agent('anything', { model, screenshots: false });
  const parts = prompts[0].flatMap((m) => (Array.isArray(m.content) ? m.content : []));
  assert.equal(parts.some((p) => p.type === 'file'), false);
});

test('act uses the one-instruction prompt', async () => {
  await browser.goto(GREET);
  const { model, prompts } = scriptedModel([
    [call('a', 'type', { element: 0, text: 'Ada' })],
    [call('b', 'done', { success: true, answer: 'Typed Ada' })],
  ]);
  const result = await browser.act('type Ada into the name box', { model });
  assert.equal(result.success, true);
  assert.equal(await browser.page.inputValue('input'), 'Ada');
  const system = prompts[0].find((m) => m.role === 'system').content;
  assert.match(system, /exactly the user's instruction/);
});

test('extract returns schema-validated data from the page text', async () => {
  await browser.goto(GREET);
  await browser.observe();
  await browser.type(0, 'Ada');
  await browser.click(1);

  const { model, prompts } = scriptedModel([[{ type: 'text', text: '{"message":"Hello Ada","name":"Ada"}' }]]);
  const data = await browser.extract('the greeting', z.object({ message: z.string(), name: z.string() }), { model });
  assert.deepEqual(data, { message: 'Hello Ada', name: 'Ada' });
  const text = prompts[0].find((m) => m.role === 'user').content.find((p) => p.type === 'text').text;
  assert.match(text, /Hello Ada/);

  const plain = scriptedModel([[{ type: 'text', text: '{"value":"Hello Ada"}' }]]);
  assert.equal(await browser.extract('the greeting', undefined, { model: plain.model }), 'Hello Ada');
});
