# 15. Where to go next

You've built a browser agent from first principles: what a page is, how a browser turns it into boxes and pixels, how a program reaches inside it, and how a language model can drive it with tools. Here's how to keep going.

## Projects on this codebase

Each one teaches something specific. Add an eval task for each, so you can prove it works.

| Project | You'll learn |
|---|---|
| **Wait smarter.** Replace the fixed 300 ms wait with "wait until the DOM stops changing" (a `MutationObserver`) | browser timing, page events |
| **Follow new tabs.** Switch to tabs opened by links | Playwright browser contexts |
| **Accessibility tree mode.** Describe the page using the accessibility tree (what screen readers use) instead of our list, and compare the pass rate | how assistive technology sees the web |
| **Coordinate mode.** Let the model click by pixel position from the screenshot, with no numbers; see where it fails | visual grounding, why set-of-mark helps |
| **Raw DevTools Protocol.** Rewrite `click` without Playwright: open a CDP connection and send `Input.dispatchMouseEvent` yourself | what Playwright does under the hood |
| **Stuck detector.** If the page hasn't changed in three steps, tell the model | agent reliability |
| **Desktop apps.** On Windows, list a desktop app's buttons with UI Automation | the same ideas, outside the browser |

## Things to read

- **Chrome DevTools Protocol** documentation (chromedevtools.github.io/devtools-protocol): the `Runtime`, `Input`, `DOM` and `Page` sections.
- **Playwright** documentation, especially "Actionability" (why clicks wait) and "Locators".
- **MDN Web Docs** (developer.mozilla.org), the best reference for HTML, CSS, the DOM and events.
- **Set-of-Mark prompting** (Yang et al., 2023), the research behind the labelled screenshots in chapter 8.
- **ReAct** (Yao et al., 2022), the reason-then-act loop that most agents descend from.
- **Benchmarks**: Mind2Web, WebArena and WebVoyager for web tasks; OSWorld for whole-desktop agents.

## Other projects doing this

Reading their source with this course behind you is the best next step:

- **browser-use** (Python), the project this one is named after: a full autonomous browser agent.
- **Stagehand** (TypeScript), with the same `act` / `extract` / `agent` idea as our library, plus production features.
- **Playwright MCP**, which exposes a browser to any agent that speaks the Model Context Protocol, using the accessibility tree.

## Hosting these docs

These chapters are plain Markdown files in `docs/`, set up for VitePress:

```bash
npm run docs:dev
```

previews them as a website, and

```bash
npm run docs:build
```

produces a static site in `docs/.vitepress/dist` that any static host can serve (GitHub Pages, Netlify, Cloudflare Pages, Vercel). For GitHub Pages under a repository path, build with `DOCS_BASE=/mini-browser-use/`.
