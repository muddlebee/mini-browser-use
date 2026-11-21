# 5. Programs that drive browsers

::: info In this chapter
- Our program and the web page run in **two separate worlds** that can't see each other.
- **Playwright** connects them, using the **Chrome DevTools Protocol**, the same channel DevTools uses.
- `page.evaluate()` sends a function into the page, runs it there, and brings the answer back.
- Scripts: `tutorial/01-open-a-browser.js` and `tutorial/02-run-code-in-the-page.js`.
:::

## Two worlds

So far you've typed JavaScript into the DevTools Console by hand. To build an agent, a **program** has to do it. That program is written in JavaScript too, but it runs in a different place:

```
┌──────────────────────────────┐                ┌──────────────────────────────┐
│  NODE.JS: our program        │                │  CHROME: the web page        │
│                              │                │                              │
│  files, the network,         │   Playwright   │  document, the DOM, buttons, │
│  AI models, your .env        │ ◄────────────► │  the page's own JavaScript   │
│                              │  (DevTools     │                              │
│  no `document` here          │   Protocol)    │  no access to your files     │
└──────────────────────────────┘                └──────────────────────────────┘
```

- **Node.js** runs JavaScript outside a browser, on your computer, like any other program. It can read files and call an AI, but it has no page, so `document` doesn't exist there.
- **Chrome** runs the page. Inside it, `document` is the DOM, but it can't touch your files or call your AI.

The agent needs both: the AI and the decision-making on the Node side, and the reading and clicking on the page side. Something has to carry messages between them.

## The bridge: Playwright and the DevTools Protocol

When you press F12, DevTools talks to the page over an internal message channel called the **Chrome DevTools Protocol (CDP)**. It's a list of commands like "run this JavaScript", "take a screenshot", "move the mouse to 200, 75 and press the button". Chrome also lets *other programs* connect to that same channel.

**Playwright** is a library (a package of ready-made code) from Microsoft that does exactly this. It starts a browser, connects to it, and gives us simple commands like `page.goto(...)` and `page.click(...)`, translating each into DevTools Protocol messages. Anything DevTools can do, our program can do.

## Script 1: open a browser

`tutorial/01-open-a-browser.js`, slightly shortened:

```js
const { chromium } = require('playwright');

const browser = await chromium.launch({ headless: true });  // start Chrome
const page = await browser.newPage();                        // open a tab
await page.goto(PRACTICE_PAGE);                              // visit our page

console.log('Title:', await page.title());                   // ask it something
await page.screenshot({ path: '01-practice-page.png' });     // take a picture

await browser.close();                                       // always close it
```

Run it:

```bash
node tutorial/01-open-a-browser.js
```

```
Address: file:///.../test.html
Title:   Test
Saved a screenshot to .../tutorial/output/01-practice-page.png
```

Three ideas in this script:

- **Headless** means the browser runs without a window on screen. It's still a complete browser that loads pages and runs their JavaScript. Set `HEADED=1` in `.env` to watch the window instead.
- **`await`** means "wait for this to finish before moving on". Talking to the browser takes time, so almost every Playwright command is awaited.
- **`chromium`** is the engine Chrome is built on. `BROWSER=chrome` uses the Chrome installed on your computer instead of Playwright's own copy.

## Script 2: run code inside the page

Here is the most important technique in the whole course. `tutorial/02-run-code-in-the-page.js`:

```js
const heading = await page.evaluate(() => document.querySelector('h1').textContent);
console.log('The heading says:', heading);   // The heading says: Hi
```

`page.evaluate` does three things:

1. It takes the function you give it and turns it into **text**.
2. It sends that text over the DevTools Protocol and Chrome runs it **inside the page**, where `document` exists.
3. Whatever the function returns is turned into plain data and sent **back** to Node.

So the arrow function `() => document.querySelector('h1').textContent` never runs in Node at all. It's the same line you typed into the Console in chapter 4, typed by our program instead.

### Two rules that follow

**Only plain data comes back.** Text, numbers, true/false, lists and simple objects survive the trip. A DOM element doesn't: it's a living object inside Chrome's memory and can't be posted across. This rule shapes our whole design. Since we can't hand an element back to Node, we leave a **bookmark** on it inside the page and send back just the bookmark's number (next chapter).

**The function can't see your program's variables.** It's sent as text and runs in another world. This fails:

```js
const name = 'Ada';
await page.evaluate(() => document.querySelector('h1').textContent = name);  // name is not defined
```

Pass values in explicitly, as a second argument:

```js
await page.evaluate((text) => { document.querySelector('h1').textContent = text; }, name);
```

Run the script to see both:

```bash
node tutorial/02-run-code-in-the-page.js
```

```
The heading says: Hi
Counts: { allElements: 10, buttons: 2, links: 1 }
Heading now: Changed by our program
Heading now: Hello from Node
```

## In the library

The library's `Browser` class (`src/browser.js`) wraps exactly this: `Browser.launch()` calls `chromium.launch()` and `newPage()`, and every way the agent looks at the page goes through `evaluate`. The page itself stays available as `browser.page`, so you can always drop down to plain Playwright.

Next: [Seeing the page like an agent](./06-seeing-the-page.md)
