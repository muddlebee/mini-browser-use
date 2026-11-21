# mini-browser-use

A minimal browser agent: observe the page, decide an action, act, repeat.

- `agent.js` — you drive. The page is shown as a numbered list of interactive elements and you type commands (`click 1`, `type 0 hello`).
- `llm-agent.js` — Claude drives. The same actions are exposed as tools and the model works toward a goal.

## Setup

Requires Node 18+.

```bash
npm install
npx playwright install chromium
```

## Drive it yourself

```bash
node agent.js https://example.com
```

Commands: `goto <url>`, `click <n>`, `type <n> <text>`, `press <key>`, `select <n> <value>`, `scroll up|down`, `back`, `text`, `shot [file]`, `quit`.

## Let Claude drive

```bash
export ANTHROPIC_API_KEY=your-key
node llm-agent.js "Type Ada into the name box, press Greet, and tell me what the page says" file://$PWD/test.html
```

Set `HEADED=1` to watch the browser window.
