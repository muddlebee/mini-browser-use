# mini-browser-use

A small library for driving a web browser with an LLM: observe the page, decide an action, act, repeat.
Works with Claude, GPT, Gemini, or any OpenAI-compatible model.

```js
const { Browser, z } = require('./src');

const browser = await Browser.launch({ model: 'anthropic:claude-opus-5-5' });
await browser.goto('test.html');

await browser.act('type "Ada" into the name box');           // one AI step
await browser.act('press the Greet button');
const data = await browser.extract('the greeting', z.object({ message: z.string() }));  // typed data out
const result = await browser.agent('greet Grace instead and tell me the greeting');      // a whole task

await browser.close();
```

## Setup

Requires Node 20.12 or newer. Works on Windows, macOS and Linux.

```bash
npm install
```

Then pick a browser:

- Use the Chrome you already have: put `BROWSER=chrome` in `.env` (see below). Nothing to download.
- Or download Playwright's bundled Chromium: `npx playwright install chromium`.

## Configuration (.env)

Copy `.env.example` to `.env` and edit it. `.env` is ignored by git, so your keys stay on your machine.

```
MODEL=anthropic:claude-opus-5-5
ANTHROPIC_API_KEY=your-key-here
BROWSER=chrome
```

- `MODEL` — which LLM drives the browser, written as `<provider>:<model-id>`. Default `anthropic:claude-opus-5-5`.
- An API key for that provider: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`.
- `CUSTOM_BASE_URL` and `CUSTOM_API_KEY` — for `MODEL=custom:<model-id>`, any OpenAI-compatible server.
- `BROWSER` — `chrome` or `msedge` to use an installed browser; leave unset for bundled Chromium.
- `HEADED` — set to `1` to show the browser window.
- `SCREENSHOTS` — set to `0` to send only the text element list (cheaper; needed for models without image input).

Variables set in your shell take priority over `.env`.

### Models

| Provider | `MODEL` | Key |
|---|---|---|
| Anthropic | `anthropic:claude-opus-5-5` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai:<model-id>` | `OPENAI_API_KEY` |
| Google | `google:<model-id>` | `GOOGLE_GENERATIVE_AI_API_KEY` |
| OpenRouter | `custom:<model-id>` with `CUSTOM_BASE_URL=https://openrouter.ai/api/v1` | `CUSTOM_API_KEY` |
| Ollama (local) | `custom:<model-id>` with `CUSTOM_BASE_URL=http://localhost:11434/v1` | none |

Use a model that supports tool calling, and image input unless `SCREENSHOTS=0`.

## Library API

`Browser.launch(options)` opens a browser. Every option is optional:

| Option | Default | |
|---|---|---|
| `model` | `MODEL` env, else `anthropic:claude-opus-5-5` | `"provider:model-id"`, or an AI SDK model object |
| `headless` | `true` unless `HEADED` is set | |
| `channel` | `BROWSER` env | `"chrome"` or `"msedge"` |
| `screenshots` | `true` unless `SCREENSHOTS=0` | send labelled screenshots to the model |
| `maxSteps` | 25 for `agent`, 5 for `act` | |
| `log` | silent | e.g. `console.log` to watch each step |
| `viewport` | 1280×800 | |

### AI methods

Each also accepts per-call overrides of those options, e.g. `browser.agent(goal, { maxSteps: 10 })`.

- **`agent(goal)`**: works toward the goal on its own. Returns `{ success, answer, steps, actions }`.
- **`act(instruction)`**: carries out one instruction ("click the login button") and stops. Same return shape.
- **`extract(instruction, schema?)`**: reads data off the page. With a zod schema it returns a typed object; without one, a string.

### Direct control (no AI)

- `observe()` numbers the visible interactive elements and returns `{ url, title, elements }`.
- `click(n)`, `type(n, text)`, `select(n, value)` act on element numbers from the latest `observe()`.
- `goto(url)`, `press(key)`, `scroll('up'|'down')`, `back()`
- `text()` returns the visible text.
- `screenshot()` returns a JPEG with the elements labelled.
- `page` is the underlying Playwright page, for anything else.

`z` (zod) is re-exported for writing schemas. See `examples/basic.js` for a runnable example.

## Commands

Drive it yourself, typing commands like `click 1` or `type 0 hello`:

```bash
node agent.js test.html
```

Commands: `goto <url>`, `click <n>`, `type <n> <text>`, `press <key>`, `select <n> <value>`, `scroll up|down`, `back`, `text`, `shot [file]`, `quit`. `shot` saves the labelled screenshot the model would see.

Let the model drive:

```bash
node llm-agent.js "Type Ada into the name box, press Greet, and tell me what the page says" test.html
```

## Tests and evals

```bash
npm test
```

Tests use a scripted fake model, so they need no API key and cost nothing.

```bash
npm run eval
```

The eval gives the agent five tasks on local pages in `evals/pages` (fill a form, compare prices, follow links, use a dropdown, scroll to find a button) and reports a pass rate for the configured `MODEL`. It makes real API calls. Run one task with `npm run eval -- navigate-links`. Add tasks in `evals/tasks.js`.

## How it is built

```
src/page.js      code that runs inside the page: number elements, draw labels
src/browser.js   the Browser class: direct actions + agent/act/extract
src/tools.js     the action menu the model chooses from
src/agent.js     the observe -> decide -> act loop
src/extract.js   structured extraction
src/model.js     "provider:model-id" -> model, via the Vercel AI SDK
```
