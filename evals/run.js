#!/usr/bin/env node
// Run every task against a real model and report a pass rate.
//   npm run eval                      (uses MODEL from .env)
//   npm run eval -- navigate-links    (only tasks whose name contains this text)
const path = require('path');
const { Browser, loadEnv, DEFAULT_MODEL } = require('../src');
const tasks = require('./tasks');

async function runEval({ model, filter = '', maxSteps = 15, log = console.log } = {}) {
  const results = [];
  for (const task of tasks.filter((t) => t.name.includes(filter))) {
    const browser = await Browser.launch(); // a fresh browser per task, so tasks can't affect each other
    const started = Date.now();
    let outcome;
    try {
      await browser.goto(task.start);
      const r = await browser.agent(task.goal, { model, maxSteps });
      outcome = { pass: r.success && task.check(r.answer), steps: r.steps, answer: r.answer };
    } catch (e) {
      outcome = { pass: false, steps: 0, answer: `ERROR: ${e.message.split('\n')[0]}` };
    } finally {
      await browser.close();
    }
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    results.push({ name: task.name, ...outcome, seconds });
    log(`${outcome.pass ? 'PASS' : 'FAIL'}  ${task.name.padEnd(18)} ${String(outcome.steps).padStart(2)} steps ` +
      `${seconds.padStart(5)}s  ${outcome.answer.replace(/\s+/g, ' ').slice(0, 70)}`);
  }
  const passed = results.filter((r) => r.pass).length;
  log(`\n${passed}/${results.length} passed`);
  return results;
}

module.exports = { runEval };

if (require.main === module) {
  loadEnv(path.join(__dirname, '..', '.env'));
  console.log(`model: ${process.env.MODEL || DEFAULT_MODEL}\n`);
  runEval({ filter: process.argv[2] || '' }).then((results) => {
    process.exitCode = results.every((r) => r.pass) ? 0 : 1;
  });
}
