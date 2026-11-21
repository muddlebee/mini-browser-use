#!/usr/bin/env node
// Let an LLM drive the browser toward a goal.
//   node llm-agent.js "<goal>" [start-url]
// Pick the model with MODEL=<provider>:<model-id> in .env (see .env.example).
const path = require('path');
const { Browser, loadEnv, DEFAULT_MODEL } = require('./src');

loadEnv(path.join(__dirname, '.env'));

(async () => {
  const [goal, startUrl] = process.argv.slice(2);
  if (!goal) { console.error('usage: node llm-agent.js "<goal>" [start-url]'); process.exit(1); }
  console.log(`model: ${process.env.MODEL || DEFAULT_MODEL}`);

  const browser = await Browser.launch({ log: console.log });
  try {
    if (startUrl) await browser.goto(startUrl);
    const result = await browser.agent(goal);
    console.log(`\n${result.success ? 'DONE' : 'FAILED'} after ${result.steps} steps: ${result.answer}`);
  } finally {
    await browser.close();
  }
})();
