#!/usr/bin/env node
// Course: chapter 7 (you are the brain).
// Drive the browser yourself: see the numbered elements, type a command, repeat.
//   node agent.js [url]
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { Browser, loadEnv } = require('./src');

loadEnv(path.join(__dirname, '.env'));

const HELP = 'commands: goto <url> | click <n> | type <n> <text> | press <key> | select <n> <value> | ' +
  'scroll up|down | back | text | shot [file] | quit';

// Each command maps to a Browser method. Arguments arrive as words typed after the command.
const commands = {
  goto: (b, url) => b.goto(url),
  click: (b, n) => b.click(n),
  type: (b, n, ...words) => b.type(n, words.join(' ')),
  press: (b, key) => b.press(key),
  select: (b, n, ...words) => b.select(n, words.join(' ')),
  scroll: (b, dir) => b.scroll(dir),
  back: (b) => b.back(),
  text: async (b) => console.log(await b.text(3000)),
  shot: async (b, file = 'shot.jpg') => { fs.writeFileSync(file, await b.screenshot()); console.log('saved', file); },
};

(async () => {
  const browser = await Browser.launch();
  if (process.argv[2]) await browser.goto(process.argv[2]);
  console.log(HELP);
  const lines = readline.createInterface({ input: process.stdin })[Symbol.asyncIterator]();

  while (true) {
    // OBSERVE
    const state = await browser.observe();
    console.log(`\n== ${state.title} — ${state.url}`);
    console.log(state.elements.join('\n') || '(no interactive elements in view)');
    process.stdout.write('> ');
    // DECIDE (you)
    const { value, done } = await lines.next();
    const [cmd, ...args] = (done ? 'quit' : value).trim().split(/\s+/);
    if (cmd === 'quit' || cmd === 'exit') break;
    if (!commands[cmd]) { console.log(HELP); continue; }
    // ACT
    try {
      await commands[cmd](browser, ...args);
    } catch (e) {
      console.log('! action failed:', e.message.split('\n')[0]); // errors are feedback, not crashes
    }
  }
  await browser.close();
})();
