// Chapter 8: ask a language model to choose an action. No browser yet: just the model's side.
//   node tutorial/06-first-tool-call.js        (needs an API key in .env, see docs/setup.md)
const { generateText, tool } = require('ai');
const { z } = require('zod');
const { resolveModel } = require('../src/model');
require('./helpers'); // loads .env

(async () => {
  const result = await generateText({
    model: resolveModel(), // MODEL from .env, e.g. anthropic:claude-opus-5-5
    // The menu of actions the model may choose from. We only DESCRIBE them; no execute function,
    // so the model's choice comes back to us instead of running.
    tools: {
      click: tool({
        description: 'Click an element on the page.',
        inputSchema: z.object({ element: z.number().describe('The element number') }),
      }),
      type: tool({
        description: 'Type text into a text box.',
        inputSchema: z.object({ element: z.number(), text: z.string() }),
      }),
    },
    prompt: `Goal: greet Ada.
The page has these elements:
[0] <input> Your name
[1] <button> Greet
What should be done first?`,
  });

  console.log('The model wrote:', result.text || '(no text)');
  for (const call of result.toolCalls) {
    console.log('The model chose:', call.toolName, JSON.stringify(call.input));
  }
})();
