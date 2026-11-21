# Glossary

Words used in the course, in plain language. The chapter where each is explained is in brackets.

**Accessibility tree**: a simplified version of the page that browsers build for screen readers, listing things like buttons and headings with their names. (15)

**Act**: in this library, carrying out one instruction with the model's help, e.g. "click the login button". (11)

**Action**: something the agent does to the page: click, type, press a key, choose from a dropdown, scroll, go back, open an address. (7)

**Actionability**: Playwright's checks before acting: the element must be visible, enabled, still, and not covered by something else. (7)

**Agent**: a program that works toward a goal in a loop: look, decide, act, repeat. A **browser agent** does this in a web browser. (10)

**AI SDK**: the Vercel AI SDK, a library that lets the same code talk to many AI providers. (9)

**API key**: a secret password identifying your account to an AI provider. (Setup)

**Attribute**: an extra detail written inside an opening tag, like `href="..."` on a link or `placeholder="..."` on a text box. (1)

**Bounding box**: the rectangle an element occupies on screen: x, y, width and height in pixels. (3)

**Cache**: stored results reused later to save time. Here, remembered `act` steps that can be replayed without the model. (11)

**CDP (Chrome DevTools Protocol)**: the message channel DevTools uses to control Chrome. Playwright uses it too. (5)

**Child / parent**: an element directly inside another is its child; the outer one is its parent. (2)

**Chromium**: the open-source browser that Chrome and Edge are built on. (5)

**Console**: the DevTools tab where you can type JavaScript that runs inside the page. (4)

**CSS**: the language that decides how elements look and where they go. (1)

**`data-` attribute**: an attribute anyone may invent for their own use. Our agent writes `data-mbu="3"` onto element 3. (6)

**DevTools**: Chrome's built-in tools for looking inside a page. Open with F12. (2)

**DOM (Document Object Model)**: the live tree of objects the browser builds from HTML. What the browser draws, and what code reads and changes. (2)

**Element**: one piece of a page, such as a heading, a button or a link, written with tags. (1)

**Eval**: a set of tasks with known answers, used to measure how well a real model does. (14)

**Event**: something that happens on the page, like a click or a key press, that code can react to. (4)

**Extract**: in this library, reading data off a page into a fixed shape. (11)

**Headless**: a browser running without a visible window. (5)

**Hit testing**: the browser working out which element is under the mouse. (4)

**HTML**: the language web pages are written in: text marked up with tags. (1)

**Iframe**: an element that shows a whole separate web page inside the current one. (12)

**JavaScript**: the programming language that runs inside web pages, and in Node.js. (1, 5)

**Layout**: the browser step that works out the position and size of every element. (3)

**Listener**: code attached to an element that runs when a certain event happens. (4)

**LLM (large language model)**: an AI that reads text (and often images) and writes text, such as Claude, GPT or Gemini. (9)

**Locator**: Playwright's way of describing how to find an element when you act on it. (7)

**Message**: one entry in a conversation with a model, with a role: system, user, assistant or tool. (9)

**Node.js**: a program that runs JavaScript outside a browser, on your computer. (5)

**Page state**: our numbered list of interactive elements, plus the address and title: what the model reads each step. (6)

**Playwright**: a library from Microsoft for controlling browsers from a program. (5)

**Prompt injection**: text on a page (or anywhere the model reads) written to trick the model into doing something the user didn't ask for. (13)

**Schema**: an exact description of the shape some data must have, e.g. "an object with a number called element". (9)

**Selector**: a short pattern that describes which elements you mean, like `button` or `#o` or `[data-mbu="3"]`. (4)

**Set-of-mark**: drawing numbered labels on a screenshot so a model can refer to things by number. (8)

**Shadow DOM**: a walled-off part of the DOM inside a component, hidden from ordinary searches. (12)

**System message**: standing instructions for the model, sent at the top of every conversation. (9, 10)

**Tag**: a word in angle brackets that marks up HTML, like `<h1>` and `</h1>`. (1)

**Tool / tool call / tool result**: a tool is an action we describe to the model; a tool call is the model asking for it; the tool result is what happened, sent back to the model. (9)

**Trusted event**: an event that came from real input rather than a script. (4)

**Viewport**: the part of the page currently on screen. (3)

**z-index**: the CSS setting that decides which overlapping element is on top. (3)

**zod**: a library for writing schemas in JavaScript. (9)
