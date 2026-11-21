# mini-browser-use

A minimal browser agent: observe the page, decide an action, act, repeat.

- `agent.js` — you drive. The page is shown as a numbered list of interactive elements and you type commands (`click 1`, `type 0 hello`).
- `llm-agent.js` — an LLM drives (Claude, GPT, Gemini, or any OpenAI-compatible model). The same actions are exposed as tools and the model works toward a goal.

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
- `CUSTOM_BASE_URL` and `CUSTOM_API_KEY` — for `MODEL=custom:<model-id>`, any OpenAI-compatible server (OpenRouter, Ollama, LM Studio, Groq, ...).
- `BROWSER` — `chrome` or `msedge` to use an installed browser; leave unset for bundled Chromium.
- `HEADED` — set to `1` to show the browser window.
- `SCREENSHOTS` — set to `0` to send only the text element list (cheaper; needed for models without image input).

Variables set in your shell take priority over `.env`.

## Drive it yourself

```bash
node agent.js https://example.com
```

A local file works too:

```bash
node agent.js test.html
```

Commands: `goto <url>`, `click <n>`, `type <n> <text>`, `press <key>`, `select <n> <value>`, `scroll up|down`, `back`, `text`, `shot [file]`, `quit`.

`shot` saves the labelled screenshot the model would see (`shot.jpg` by default).

## Let an LLM drive

`llm-agent.js` works with any model that supports tool calling, through the [Vercel AI SDK](https://ai-sdk.dev). Pick it with `MODEL`:

| Provider | `MODEL` | Key |
|---|---|---|
| Anthropic | `anthropic:claude-opus-5-5` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai:<model-id>` | `OPENAI_API_KEY` |
| Google | `google:<model-id>` | `GOOGLE_GENERATIVE_AI_API_KEY` |
| OpenRouter | `custom:<model-id>` with `CUSTOM_BASE_URL=https://openrouter.ai/api/v1` | `CUSTOM_API_KEY` |
| Ollama (local) | `custom:<model-id>` with `CUSTOM_BASE_URL=http://localhost:11434/v1` | none |

Use a model that supports tool calling, and image input unless `SCREENSHOTS=0`.

After every action the model gets the numbered element list plus a screenshot with each element outlined in red and labelled with its number, so it can match what it sees to what it can click.

```bash
node llm-agent.js "Type Ada into the name box, press Greet, and tell me what the page says" test.html
```
