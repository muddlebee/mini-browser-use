// Using mini-browser-use as a library: direct actions, act, extract and agent.
//   node examples/basic.js
const path = require('path');
const { Browser, loadEnv, z } = require('../src');

loadEnv(path.join(__dirname, '..', '.env'));

(async () => {
  const browser = await Browser.launch({ log: console.log });
  try {
    await browser.goto(path.join(__dirname, '..', 'test.html'));

    // 1. Direct control, no AI: look, then act by element number.
    const { elements } = await browser.observe();
    console.log(elements);

    // 2. One AI step at a time.
    await browser.act('type "Ada" into the name box');
    await browser.act('press the Greet button');

    // 3. Typed data out of the page.
    const greeting = await browser.extract(
      'the greeting message shown on the page',
      z.object({ message: z.string(), name: z.string() }),
    );
    console.log(greeting); // { message: 'Hello Ada', name: 'Ada' }

    // 4. A whole task on its own.
    const result = await browser.agent('Clear the name box, greet "Grace" instead, and tell me the greeting');
    console.log(result.answer);
  } finally {
    await browser.close();
  }
})();
