# Setup

You need three things: **Node.js** to run the code, **the project files**, and **a browser**. Chapters 9 onwards also need an **API key** for an AI model. These steps are written for Windows; macOS and Linux notes are included.

## 1. Install Node.js

Node.js runs JavaScript programs on your computer (chapter 5 explains why that matters).

1. Go to [nodejs.org](https://nodejs.org) and download the **LTS** version (version 20.12 or newer).
2. Run the installer and accept the defaults.
3. Open a terminal. On Windows, press the Windows key, type **PowerShell** and open it. On macOS, open **Terminal**.
4. Check it worked:

```bash
node -v
```

You should see a version number like `v22.x.x`.

A **terminal** is a window where you type commands instead of clicking. Every grey box that starts with a command in this course is something to type there, then press Enter.

## 2. Get the project

If you have **Git** installed ([git-scm.com](https://git-scm.com)):

```bash
git clone https://github.com/muddlebee/mini-browser-use.git
```

Otherwise, on the GitHub page click **Code → Download ZIP** and unzip it.

Then move into the folder and install the packages the project uses:

```bash
cd mini-browser-use
```

```bash
npm install
```

`npm` comes with Node.js. It downloads the libraries listed in `package.json`, such as Playwright and the AI SDK, into a `node_modules` folder.

## 3. Choose a browser

The project can use either:

- **The Chrome (or Edge) already on your computer.** Nothing to download. Set this in the `.env` file below with `BROWSER=chrome` (or `BROWSER=msedge`).
- **Playwright's own copy of Chromium**, which is what Chrome is built on. Download it once with:

```bash
npx playwright install chromium
```

## 4. Create your settings file

Settings live in a file called `.env` in the project folder. Copy the example:

```bash
copy .env.example .env
```

(On macOS or Linux: `cp .env.example .env`.)

Open `.env` in a text editor. For Part 2, you only need:

```
BROWSER=chrome
```

Add `HEADED=1` if you want to watch the browser window while scripts run.

## 5. Check it works

```bash
node tutorial/01-open-a-browser.js
```

You should see the page title and a saved screenshot in `tutorial/output/`. You're ready for [chapter 1](./part-1-the-web/01-what-is-a-web-page.md).

## 6. An AI model (from chapter 9)

Chapters 9 onwards call an AI model, which needs an **API key** from a provider. It's a secret password tied to your account, and usage is billed by the provider.

| Provider | Get a key at | Put in `.env` |
|---|---|---|
| Anthropic (Claude) | console.anthropic.com | `ANTHROPIC_API_KEY=...` |
| OpenAI | platform.openai.com | `OPENAI_API_KEY=...` and `MODEL=openai:<model-id>` |
| Google (Gemini) | aistudio.google.com | `GOOGLE_GENERATIVE_AI_API_KEY=...` and `MODEL=google:<model-id>` |
| OpenRouter (many models) | openrouter.ai | `CUSTOM_BASE_URL=https://openrouter.ai/api/v1`, `CUSTOM_API_KEY=...`, `MODEL=custom:<model-id>` |
| Ollama (free, runs on your computer) | ollama.com | `CUSTOM_BASE_URL=http://localhost:11434/v1`, `MODEL=custom:<model-id>` |

The default model is `anthropic:claude-opus-5-5`. Pick a model that supports **tool calling** and, ideally, **image input**.

::: warning Keep your key secret
`.env` is listed in `.gitignore`, so Git won't upload it. Never paste a key into a chat, an issue or a commit. If one leaks, delete it in the provider's console and create a new one.
:::

Check the model connection:

```bash
node tutorial/06-first-tool-call.js
```

## Running the tests

```bash
npm test
```

Tests use a fake model, so they need no key and cost nothing (chapter 14).
