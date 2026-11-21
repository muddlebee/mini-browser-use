# mini-browser-use

**Learn how AI browser agents work by building one from scratch.**

This repository is a course and a working library. The course starts from "what is a web page?", with no web development knowledge assumed, and builds up to an AI that looks at a real browser, decides what to do, clicks and types, and finishes tasks. It works with Claude, GPT, Gemini or any OpenAI-compatible model.

```js
const browser = await Browser.launch();
await browser.goto('test.html');
const result = await browser.agent('Type Ada into the name box, press Greet, and tell me what the page says');
console.log(result.answer);
```

## The course

Read it in [`docs/`](docs/index.md), or as a website (see [Docs site](#docs-site)).

| Part | Chapters |
|---|---|
| **1. How the web works** | [What is a web page?](docs/part-1-the-web/01-what-is-a-web-page.md) · [The DOM](docs/part-1-the-web/02-the-dom.md) · [How a browser draws a page](docs/part-1-the-web/03-how-a-browser-draws-a-page.md) · [JavaScript and events](docs/part-1-the-web/04-javascript-and-events.md) |
| **2. Controlling a browser** | [Programs that drive browsers](docs/part-2-controlling-a-browser/05-programs-that-drive-browsers.md) · [Seeing the page](docs/part-2-controlling-a-browser/06-seeing-the-page.md) · [Acting on the page](docs/part-2-controlling-a-browser/07-acting-on-the-page.md) · [Pictures for the model](docs/part-2-controlling-a-browser/08-pictures-for-the-model.md) |
| **3. Adding a brain** | [How models use tools](docs/part-3-adding-a-brain/09-how-language-models-use-tools.md) · [The agent loop](docs/part-3-adding-a-brain/10-the-agent-loop.md) · [act, extract and caching](docs/part-3-adding-a-brain/11-act-extract-and-caching.md) |
| **4. The real world** | [The messy real web](docs/part-4-the-real-world/12-the-messy-real-web.md) · [Keeping an agent safe](docs/part-4-the-real-world/13-safety.md) · [Testing and evals](docs/part-4-the-real-world/14-testing-and-evals.md) · [Where to go next](docs/part-4-the-real-world/15-where-next.md) |

Start with [setup](docs/setup.md). There's a [glossary](docs/glossary.md) for every term.

Each chapter has a small runnable script in [`tutorial/`](tutorial/) that shows one idea with plain Playwright. Every file in [`src/`](src/) names the chapters that explain it.

## Quick start

Requires Node 20.12 or newer. Works on Windows, macOS and Linux.

```bash
npm install
```

```bash
copy .env.example .env
```

(macOS/Linux: `cp .env.example .env`.) In `.env`, set `BROWSER=chrome` to use your installed Chrome, or run `npx playwright install chromium` once. Add an API key for the AI chapters; see [setup](docs/setup.md).

```bash
node tutorial/01-open-a-browser.js
```

## The project

```
docs/        the course (Markdown, built into a website with VitePress)
tutorial/    one small script per idea, numbered in course order
src/         the library
  page.js      code that runs inside the page: number elements, draw labels       (ch. 5, 6, 8, 12)
  browser.js   the Browser class: actions, guardrails                             (ch. 5, 7, 13)
  tools.js     the action menu the model chooses from                             (ch. 9, 10)
  agent.js     the observe -> decide -> act loop; act and its cache               (ch. 10, 11)
  extract.js   structured extraction                                              (ch. 11)
  cache.js     remembered act() steps                                             (ch. 11)
  model.js     "provider:model-id" -> model, via the Vercel AI SDK                (ch. 9)
agent.js     drive a browser yourself, typing commands                            (ch. 7)
llm-agent.js let a model drive toward a goal                                      (ch. 10)
test/        automated tests with a scripted fake model                           (ch. 14)
evals/       real-model tasks on small made-up sites                              (ch. 14)
```

## Library reference

`Browser.launch(options)` opens a browser. Every option is optional:

| Option | Default | |
|---|---|---|
| `model` | `MODEL` env, else `anthropic:claude-opus-5-5` | `"provider:model-id"`, or an AI SDK model object |
| `headless` | `true` unless `HEADED` is set | |
| `channel` | `BROWSER` env | `"chrome"` or `"msedge"` |
| `screenshots` | `true` unless `SCREENSHOTS=0` | send labelled screenshots to the model |
| `maxSteps` | 25 for `agent`, 5 for `act` | |
| `historySteps` | 10 | start a fresh, summarised conversation after this many steps |
| `allowedDomains` | any site | e.g. `['example.com']`; other sites, and links or redirects to them, are blocked |
| `confirm` | none | `async ({ action, target }) => boolean`, asked before risky clicks |
| `cache` | off | cache `act()` steps: `true` for memory, or a JSON file path |
| `log` | silent | e.g. `console.log` to watch each step |
| `viewport` | 1280×800 | |

**AI methods.** Each accepts per-call overrides of the options above.

- `agent(goal)` works toward a goal. Returns `{ success, answer, steps, actions }`.
- `act(instruction)` carries out one instruction. Same shape, plus `cached`.
- `extract(instruction, schema?)` reads data off the page; typed with a zod schema, a string without.

**Direct control.**

- `observe()` returns `{ url, title, elements, boxes }`.
- `click(n)`, `type(n, text)` and `select(n, value)` use numbers from the latest `observe()`.
- `goto(url)`, `press(key)`, `scroll('up'|'down')`, `back()`, `text()`, `screenshot()`
- `page` is the Playwright page.

`z` (zod) is re-exported.

### Models

| Provider | `MODEL` | Key |
|---|---|---|
| Anthropic | `anthropic:claude-opus-5-5` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai:<model-id>` | `OPENAI_API_KEY` |
| Google | `google:<model-id>` | `GOOGLE_GENERATIVE_AI_API_KEY` |
| OpenRouter | `custom:<model-id>` with `CUSTOM_BASE_URL=https://openrouter.ai/api/v1` | `CUSTOM_API_KEY` |
| Ollama (local) | `custom:<model-id>` with `CUSTOM_BASE_URL=http://localhost:11434/v1` | none |

### Commands

```bash
node agent.js test.html
```

```bash
node llm-agent.js "What is the capital of Zorbia?" evals/pages/index.html
```

The first lets you drive with commands like `click 1`. The second lets the model drive. For the second, `ALLOWED_DOMAINS=...` and `CONFIRM=1` in `.env` add guardrails.

## Tests and evals

```bash
npm test
```

```bash
npm run eval
```

Tests use a fake model: no key, no cost. Evals run 8 tasks on local made-up sites against a real model. Baseline: `anthropic:claude-opus-5-5` passed 8/8 (November 2026). See [chapter 14](docs/part-4-the-real-world/14-testing-and-evals.md).

## Safety

Pages can contain text written to manipulate an AI ("ignore your instructions and..."). The model is told page content is never instructions, but no model is fully immune. Use `allowedDomains` and `confirm`, and don't give an agent logged-in access you can't afford to have misused. See [chapter 13](docs/part-4-the-real-world/13-safety.md).

## Docs site

The course is a [VitePress](https://vitepress.dev) site:

```bash
npm run docs:dev
```

```bash
npm run docs:build
```

The build writes a static site to `docs/.vitepress/dist`, ready for any static host. For GitHub Pages under the repository path, build with `DOCS_BASE=/mini-browser-use/`. To refresh the screenshots in the docs, run `node docs/scripts/generate-images.js`.
