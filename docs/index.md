# Build a browser agent from scratch

This is a course in building an **AI that uses a web browser**: it looks at a page, decides what to do, clicks and types, and repeats until the job is done. Tools like this are called **browser agents**.

You don't need to know anything about web development. The course starts from "what is a web page?" and builds up, one idea at a time, to a working library that lets Claude, GPT, Gemini or any similar model drive a real browser.

![The practice page, as the agent sees it](/images/practice-labelled.png)

## What you'll build

By the end, this works, and you'll understand every line behind it:

```js
const browser = await Browser.launch();
await browser.goto('test.html');
const result = await browser.agent('Type Ada into the name box, press Greet, and tell me what the page says');
console.log(result.answer);   // The page now says "Hello Ada".
```

## How the course works

Each chapter explains one idea in plain language, shows a small script that demonstrates it, and points to where it lives in the finished library. Run the scripts as you go; seeing it happen is most of the learning.

- **Scripts** are in `tutorial/`, numbered in order.
- **The finished library** is in `src/`. Each file says which chapter explains it.
- **Try it** boxes are short experiments in Chrome's built-in developer tools. No setup needed.
- Unfamiliar words are in the [glossary](./glossary.md).

Start with [setup](./setup.md): install Node.js and get the project running. It takes about ten minutes.

## Course map

### Part 1: How the web works
What an agent is looking at. No programming yet.

1. [What is a web page?](./part-1-the-web/01-what-is-a-web-page.md): HTML, elements, attributes, CSS, JavaScript
2. [The DOM: the page as a tree](./part-1-the-web/02-the-dom.md): what the browser builds from HTML, and why it's live
3. [How a browser draws a page](./part-1-the-web/03-how-a-browser-draws-a-page.md): layout, boxes, visibility, the viewport
4. [JavaScript and events](./part-1-the-web/04-javascript-and-events.md): selectors, clicks, trusted events

### Part 2: Controlling a browser from a program
Giving a program eyes and hands.

5. [Programs that drive browsers](./part-2-controlling-a-browser/05-programs-that-drive-browsers.md): Playwright, the DevTools Protocol, two worlds
6. [Seeing the page like an agent](./part-2-controlling-a-browser/06-seeing-the-page.md): the numbered element list
7. [Acting on the page](./part-2-controlling-a-browser/07-acting-on-the-page.md): real clicks and typing; you as the brain
8. [Pictures for the model](./part-2-controlling-a-browser/08-pictures-for-the-model.md): labelled screenshots

### Part 3: Adding a brain
Letting a language model decide.

9. [How language models use tools](./part-3-adding-a-brain/09-how-language-models-use-tools.md): messages, tools, tool calls
10. [The agent loop](./part-3-adding-a-brain/10-the-agent-loop.md): a whole agent, then a robust one
11. [act, extract and caching](./part-3-adding-a-brain/11-act-extract-and-caching.md): less freedom, more control

### Part 4: The real world
What makes real sites hard, and agents safe.

12. [The messy real web](./part-4-the-real-world/12-the-messy-real-web.md): iframes, shadow DOM, known limits
13. [Keeping an agent safe](./part-4-the-real-world/13-safety.md): prompt injection and guardrails
14. [Testing and evals](./part-4-the-real-world/14-testing-and-evals.md): fake models, real scores
15. [Where to go next](./part-4-the-real-world/15-where-next.md): projects, reading, other tools
