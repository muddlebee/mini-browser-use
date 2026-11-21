# mini-browser-use

A minimal browser agent: observe the page, decide an action, act, repeat.

- `agent.js` — you drive. The page is shown as a numbered list of interactive elements and you type commands (`click 1`, `type 0 hello`).
- `llm-agent.js` — Claude drives. The same actions are exposed as tools and the model works toward a goal.

## Setup

Requires Node 20.12 or newer. Works on Windows, macOS and Linux.

```bash
npm install
```

Then pick a browser:

- Use the Chrome you already have: put `BROWSER=chrome` in `.env` (see below). Nothing to download.
- Or download Playwright's bundled Chromium: `npx playwright install chromium`.

## Configuration (.env)

Copy `.env.example` to `.env` and edit it. `.env` is ignored by git, so your key stays on your machine.

```
ANTHROPIC_API_KEY=your-key-here
BROWSER=chrome
HEADED=1
```

- `ANTHROPIC_API_KEY` — needed only for `llm-agent.js`.
- `BROWSER` — `chrome` or `msedge` to use an installed browser; leave unset for bundled Chromium.
- `HEADED` — set to `1` to show the browser window.
- `SCREENSHOTS` — set to `0` to stop sending screenshots to Claude (cheaper, text list only).

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

`shot` saves the labelled screenshot Claude would see (`shot.jpg` by default).

## Let Claude drive

After every action Claude gets the numbered element list plus a screenshot with each element outlined in red and labelled with its number, so it can match what it sees to what it can click.

```bash
node llm-agent.js "Type Ada into the name box, press Greet, and tell me what the page says" test.html
```
