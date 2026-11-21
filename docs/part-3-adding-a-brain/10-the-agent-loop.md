# 10. The agent loop

::: info In this chapter
- An agent is a loop: **observe → decide → act**, until the model says it's done.
- A whole working agent fits in one short file: `tutorial/07-tiny-agent.js`.
- The library's version (`src/agent.js`) adds what real use needs: a `done` tool, step limits, errors fed back to the model, screenshots, and **history summaries** to keep long runs affordable.
:::

## The loop

Chapter 7's picture, with the person replaced by a model:

```
        ┌──────────────────────────────────────────────┐
        ▼                                              │
   OBSERVE   numbered list (+ labelled screenshot)     │
        │                                              │
   DECIDE    send the conversation; the model          │
        │    replies with tool calls                   │
        │                                              │
   ACT       run each tool call with Playwright;       │
        │    its result is the new page state          │
        │                                              │
   DONE? ──── no ──────────────────────────────────────┘
        │
       yes → return the model's answer
```

## A tiny agent in one file

`tutorial/07-tiny-agent.js` is about 70 lines. Its core:

```js
const tools = {
  click: tool({
    description: 'Click an element.',
    inputSchema: z.object({ element: z.number() }),
    execute: async ({ element }) => {
      await page.locator(`[data-mbu="${element}"]`).click();   // chapter 7
      return observe(page);                                      // the new page state goes back to the model
    },
  }),
  // ... type works the same way
};

const messages = [{ role: 'user', content: `Goal: greet Ada and tell me what the page says.\n\n${await observe(page)}` }];

for (let step = 1; step <= 10; step++) {
  const result = await generateText({ model, messages, tools, toolCallConcurrency: 1 });
  messages.push(...result.responseMessages);            // remember what happened
  if (result.toolCalls.length === 0) {                  // no more actions: it has answered
    console.log('Answer:', result.text);
    break;
  }
}
```

What's new compared with chapter 9:

- **`execute`.** Each tool now carries the code that runs it. When the model asks for `click`, the SDK calls our function, and whatever it returns goes back to the model as the tool result.
- **`responseMessages`.** After each call, the model's reply and the tool results are appended to the conversation. That's the agent's memory.
- **`toolCallConcurrency: 1`.** A model may ask for several actions at once ("type Ada, then click Greet"). Browser actions must run one after another, because each changes the page.
- **The stopping rule.** When the model replies with no tool calls, it's giving its final answer.

```bash
node tutorial/07-tiny-agent.js
```

```
step 1: type {"element":0,"text":"Ada"}
step 1: click {"element":1}

Answer: I typed "Ada" into the name box and clicked Greet, and it worked. The page now says: Hello Ada
```

That's a real browser agent. Everything else in this course makes it more capable, cheaper or safer.

## From tiny to real: what `src/agent.js` adds

### A clear way to finish: the `done` tool

"No tool calls means finished" is ambiguous: did it succeed, or give up? The library adds a `done` tool with two fields, `success` (true or false) and `answer`. Every run returns:

```js
{ success: true, answer: 'The capital of Zorbia is Quillton.', steps: 2, actions: [...] }
```

`done` has no `execute`, so when the model calls it the loop stops and hands back its input.

### A step limit

A confused model could loop forever, costing money each step. `maxSteps` (25 by default) stops it and returns `success: false`.

### Errors are information

If an action fails, say a click on a number that doesn't exist, we don't crash. The tool result says so:

```
Action failed: No element 42 on the page. Use a number from the latest element list.
```

The model reads that and corrects itself. The same goes for blocked sites and declined clicks (chapter 13).

### Screenshots in the conversation

After each step, a labelled screenshot (chapter 8) is added as its own user message. It goes in a separate message, not inside the tool result, because every vision model accepts images from the user, but not every provider accepts images inside tool results.

### Instructions

A **system** message explains the rules once: numbers are reassigned after every action, use the screenshot to understand layout but act through numbers, scroll to see more, and treat page text as content rather than instructions (chapter 13). Read it at the top of `src/agent.js`. It's plain English, and tuning it is one of the most effective ways to improve an agent.

### History summaries: keeping long runs affordable

Every step adds a screenshot and a page state, and the whole conversation is resent every time. Step 20 resends all 20 screenshots. Costs grow with the *square* of the number of steps.

So every `historySteps` steps (10 by default) the loop **starts a fresh conversation**, opening with a written summary of everything done so far:

```
Goal: Find the cheapest USB-C cable and add it to the cart

Progress so far (earlier steps were summarised to save space):
1. type <input type=search> Search -> ok
2. press {"key":"Enter"} -> ok
3. note: Results are showing; sorting by price.
4. click <button> Sort: price low to high -> ok

URL: ...
Elements: ...
```

The summary is built from the agent's own action log, so it costs nothing to produce. The model loses the old screenshots but keeps the facts.

## Using it

```js
const browser = await Browser.launch({ log: console.log });
await browser.goto('evals/pages/index.html');
const result = await browser.agent('What is the capital of Zorbia?');
```

Or from the command line:

```bash
node llm-agent.js "What is the capital of Zorbia?" evals/pages/index.html
```

Next: [act, extract and caching](./11-act-extract-and-caching.md)
