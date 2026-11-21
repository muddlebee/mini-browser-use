#!/usr/bin/env node
// Course: chapter 10.
// Let an LLM drive the browser toward a goal.
//   node llm-agent.js "<goal>" [start-url]
// Pick the model with MODEL=<provider>:<model-id> in .env (see .env.example).
const path = require('path');
const readline = require('readline/promises');
const { Browser, loadEnv, DEFAULT_MODEL } = require('./src');

loadEnv(path.join(__dirname, '.env'));

// CONFIRM=1: ask in the terminal before risky clicks (buy, pay, submit, delete, ...).
async function askInTerminal({ action, target }) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const reply = await rl.question(`\nAllow ${action} on ${target}? [y/N] `);
  rl.close();
  return /^y(es)?$/i.test(reply.trim());
}

(async () => {
  const [goal, startUrl] = process.argv.slice(2);
  if (!goal) { console.error('usage: node llm-agent.js "<goal>" [start-url]'); process.exit(1); }
  console.log(`model: ${process.env.MODEL || DEFAULT_MODEL}`);

  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',').map((d) => d.trim()).filter(Boolean);
  const browser = await Browser.launch({
    log: console.log,
    allowedDomains,
    confirm: process.env.CONFIRM === '1' ? askInTerminal : undefined,
  });
  try {
    if (startUrl) await browser.goto(startUrl);
    const result = await browser.agent(goal);
    console.log(`\n${result.success ? 'DONE' : 'FAILED'} after ${result.steps} steps: ${result.answer}`);
  } finally {
    await browser.close();
  }
})();
