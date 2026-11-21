# 7. Acting on the page

::: info In this chapter
- To act on element *n*, find it by its bookmark, `[data-mbu="n"]`, using a Playwright **locator**.
- Playwright clicks and types with **real, trusted input**, after checking the element is actually usable.
- After every action, wait briefly for the page to react, then **look again**: the numbers may have changed.
- Put look and act in a loop with a person deciding, and you have `agent.js`: a browser agent where *you* are the brain.
- Script: `tutorial/04-number-and-act.js`.
:::

## Finding the element again: locators

After `observe()`, element 1 carries `data-mbu="1"`. A Playwright **locator** is a description of how to find an element, used at the moment you act:

```js
const greet = page.locator('[data-mbu="1"]');
await greet.click();
```

A locator doesn't grab the element straight away; it looks it up each time you use it. If our number doesn't exist (the AI made one up, or the page changed), the library reports it clearly instead of waiting:

```
No element 42 on the page. Use a number from the latest element list.
```

That message goes back to the AI, which can then pick a real number. Errors are information, not crashes.

## What a Playwright click really does

`locator.click()` does much more than chapter 4's `element.click()`:

1. **Finds** the element.
2. **Scrolls** it into view if needed.
3. **Waits** until it's visible, enabled, not moving (animations), and **not covered** by something else. Playwright calls this checking "actionability".
4. **Works out** the centre of its box in pixels.
5. **Sends real mouse input** over the DevTools Protocol: move there, press, release.

So the browser does real hit testing (chapter 4), fires real `mousedown`/`mouseup`/`click` events, and marks them trusted. To the site, it's indistinguishable from a person with a mouse. If a cookie banner is covering the button, step 3 notices, waits, and eventually fails, and the AI learns it has to close the banner first.

The other actions work the same way:

| Action | Playwright call | What happens |
|---|---|---|
| click | `locator.click()` | real mouse press and release |
| type | `locator.fill(text)` | focuses the box, clears it, enters the text |
| press | `page.keyboard.press('Enter')` | a real key press, e.g. to submit a search |
| select | `locator.selectOption(value)` | chooses a dropdown option by its value or label |
| scroll | `page.mouse.wheel(0, 600)` | turns the mouse wheel, 600 pixels |
| back | `page.goBack()` | the browser's back button |
| goto | `page.goto(url)` | types an address in the address bar, in effect |

## Run it

```bash
node tutorial/04-number-and-act.js
```

```
[0] <input> Your name
[1] <button> Greet
[2] <a> Example

The page now says: Hello Ada
isTrusted for script click: false | for Playwright click: true
```

The last line is chapter 4's trusted-events lesson, proven: the page itself can tell a script's fake click from Playwright's.

## Wait, then look again

Actions have consequences that take time: a new page loads, a menu slides open, a framework re-draws a list. If we looked at the page instantly, we'd see it half-changed. So after every action the library **settles**:

```js
async settle() {
  await this.page.waitForLoadState('domcontentloaded').catch(() => {});  // any new page has been read
  await this.page.waitForTimeout(300);                                   // give scripts a moment to react
}
```

Then it observes from scratch. Numbers are reassigned every time, which is why the AI is told to use only numbers from the most recent list.

300 milliseconds is a simple rule of thumb. Some sites need longer, and smarter approaches wait for the network to go quiet or for the DOM to stop changing. That's a good improvement to try once you've finished the course.

## You are the brain: `agent.js`

Put "look" and "act" in a loop, with a person choosing the action, and you have a complete, if manual, browser agent:

```
        ┌────────────────────────────────────┐
        ▼                                    │
   OBSERVE: list numbered elements           │
        │                                    │
   DECIDE: you type "click 1"                │
        │                                    │
   ACT: Playwright clicks element 1          │
        │                                    │
        └──── wait for the page to settle ───┘
```

Try it:

```bash
node agent.js test.html
```

```
== Test — file:///.../test.html
[0] <input type=text> Your name
[1] <button> Greet
[2] <a -> https://example.com> Example
> type 0 Ada
> click 1
> text
Hi
Hello Ada
...
```

Commands: `goto <url>`, `click <n>`, `type <n> <text>`, `press <key>`, `select <n> <value>`, `scroll up|down`, `back`, `text`, `shot [file]`, `quit`.

Hold on to this picture. Part 3 replaces exactly one box, "DECIDE", with an AI. Everything else stays the same.

## In the library

`src/browser.js` holds the actions: `click`, `type`, `press`, `select`, `scroll`, `back`, `goto`, plus `element(n)`, which finds the bookmark (also inside iframes, chapter 12), and `settle()`. `agent.js` is a thin loop on top of them.

Next: [Pictures for the model](./08-pictures-for-the-model.md)
