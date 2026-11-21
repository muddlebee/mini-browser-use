# 6. Seeing the page like an agent

::: info In this chapter
- An AI can't look at a whole DOM: it's huge and mostly irrelevant. We give it a short **menu** of things it can interact with.
- We keep only elements that are interactive, visible and on screen, and **number** them.
- Each number is written onto its element as an attribute, `data-mbu`: a bookmark we can find later.
- Script: `tutorial/03-find-elements.js`. Library code: `observePage` in `src/page.js`.
:::

## Why not just send the whole page?

A typical shopping site's DOM has thousands of elements: layout boxes, icons, tracking scripts, hidden menus. Sending all of it to an AI would be slow, expensive, and confusing. A person doesn't take in a page that way either; they scan for the things they can *do*: buttons, links, boxes to type in.

So the agent's view of a page is a short list:

```
URL: file:///.../test.html
Title: Test
Elements:
[0] <input type=text> Your name
[1] <button> Greet
[2] <a -> https://example.com> Example
```

This list, which we call the **page state**, is what the AI reads before every decision. This chapter builds it.

## Step 1: find interactive elements

"Interactive" means a person can click it, type into it or choose from it. A CSS selector (chapter 4) covers the obvious ones:

```js
'a[href], button, input, textarea, select'
```

The library adds a few more:

- `summary`, the clickable heading of a fold-out section
- elements that declare themselves buttons, links, tabs, checkboxes or menu items with a `role` attribute (sites often build "buttons" out of plain boxes and label them this way for screen readers)
- elements with an `onclick` listener attribute
- editable areas (`contenteditable`)
- anything made focusable with `tabindex`

## Step 2: keep only what a person could use

For each match, we ask the browser about its box and its final style (chapter 3) and drop it if:

- it is zero-sized, `display: none` or `visibility: hidden`
- it is outside the viewport
- it is disabled (a greyed-out button)

Run the script to see the filtering:

```bash
node tutorial/03-find-elements.js
```

```
┌─────────┬──────────┬─────────────┬─────────┬─────┬─────┬───────┬────────┐
│ (index) │ tag      │ text        │ visible │ x   │ y   │ width │ height │
├─────────┼──────────┼─────────────┼─────────┼─────┼─────┼───────┼────────┤
│ 0       │ 'input'  │ 'Your name' │ true    │ 8   │ 80  │ 185   │ 21     │
│ 1       │ 'button' │ 'Greet'     │ true    │ 197 │ 80  │ 49    │ 21     │
│ 2       │ 'a'      │ 'Example'   │ true    │ 8   │ 117 │ 57    │ 17     │
│ 3       │ 'button' │ 'hidden'    │ false   │ 0   │ 0   │ 0     │ 0      │
└─────────┴──────────┴─────────────┴─────────┴─────┴─────┴───────┴────────┘
```

The hidden button is in the DOM but has a 0 × 0 box, so it's dropped. The AI never hears about it.

## Step 3: describe each element in a few words

The AI needs to know what each element *is*. For every survivor we build a short line from:

- its tag (`input`, `button`, `a`)
- for inputs, its type (`text`, `email`, `checkbox`...); for links, where they go
- for dropdowns, the current choice and every option:
  ```
  <select options=[Standard (5 days) | Express (1 day)]> Standard (5 days)
  ```
- a label: its visible text, or failing that its current value, its placeholder, or its `aria-label` (a description written for screen readers)

## Step 4: number them, and leave a bookmark

Now the key trick. Each element gets a number, 0, 1, 2..., and we **write that number onto the element itself** as an attribute:

```js
el.setAttribute('data-mbu', String(id));
```

After this, the input in the live DOM looks like `<input placeholder="Your name" id="n" data-mbu="0">`. (`data-` attributes are free for anyone to invent; `mbu` stands for mini-browser-use.)

Why? Recall chapter 5's rule: elements can't travel from the page back to Node. So we send back only the number, and leave a sticky note on the element. When the AI later says "click 1", we find the element whose note says 1 with a selector:

```js
page.locator('[data-mbu="1"]')
```

Before numbering, we peel off every old note. That way a number always means the element from the **latest** look at the page, never a stale one.

::: tip Try it
Open any website in Chrome, press F12, choose the Console tab, and paste:
```js
document.querySelectorAll('a[href], button, input').forEach((el, i) => {
  el.setAttribute('data-mbu', i);
  el.style.outline = '2px solid red';
});
```
Every link, button and input gets a red outline and a hidden number. Inspect one in the Elements tab and you'll see its `data-mbu`.
:::

## In the library

`src/page.js` holds all of this:

- **`scanFrame`** is the function sent into the page. It finds, filters, describes, numbers and bookmarks elements.
- **`observePage`** runs `scanFrame` and returns the page state: `{ url, title, elements, boxes }`. It also looks inside iframes, which chapter 12 explains.
- **`formatState`** turns that into the text block the AI reads.

`browser.observe()` calls `observePage` and remembers the result. That's why "element numbers refer to the latest `observe()`" appears throughout the library's docs.

Next: [Acting on the page](./07-acting-on-the-page.md)
