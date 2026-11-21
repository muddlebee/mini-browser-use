# 4. JavaScript and events

::: info In this chapter
- JavaScript can **find** elements with CSS selectors and **read or change** them.
- Pages react to **events**: clicks, key presses, typing. Code "listens" for them.
- Events made by a real mouse or keyboard are marked **trusted**. Events faked by a script are not, and some sites ignore them.
:::

## The Console: a place to type JavaScript

Open `test.html` in Chrome, press F12, and choose the **Console** tab. Whatever you type here runs as JavaScript inside the page, with full access to the DOM. Our agent works the same way: it sends small pieces of JavaScript into the page (chapter 5).

Try a few lines. Type each one and press Enter:

```js
document.title
```
`"Test"`: the page's title.

```js
document.querySelector('h1').textContent
```
`"Hi"`: the text of the first `<h1>`.

```js
document.querySelector('h1').textContent = 'I changed this'
```
The heading on the page changes.

`document` is the DOM itself; everything starts from it.

## Finding elements: CSS selectors

`querySelector` takes a **selector**: a short pattern that describes which elements you want. Selectors come from CSS, where they pick which elements a style applies to.

| Selector | Matches |
|---|---|
| `button` | every `<button>` |
| `#o` | the element with `id="o"` |
| `a[href]` | every `<a>` that has an `href` attribute |
| `[data-mbu="3"]` | every element whose `data-mbu` attribute is exactly `3` |
| `button, input` | every button **and** every input (the comma means "or") |

- `document.querySelector(selector)` returns the **first** match.
- `document.querySelectorAll(selector)` returns **all** of them.

```js
document.querySelectorAll('a[href], button, input').length
```

That one line is the core of how our agent finds things to interact with. Its real selector is longer, and includes things like elements marked as acting like buttons, but it's the same idea.

The `[data-mbu="3"]` row matters most: it's how the agent finds element number 3 again after it has numbered them (chapter 6).

## Reading and changing elements

Once you have an element, you can ask it things and change it:

```js
const box = document.querySelector('input')
box.placeholder                    // "Your name"
box.value = 'Ada'                  // type into it
box.getBoundingClientRect()        // where it is (chapter 3)
getComputedStyle(box).display      // its final CSS display value
box.setAttribute('data-mbu', '0')  // stick our own attribute on it
```

Each of these appears in our agent's code.

## Events: how pages react

A page is mostly idle, waiting for something to happen. Each thing that happens is an **event**: a click, a key press, a mouse movement, the page finishing loading, text being typed into a box.

Code reacts by **listening** for an event on an element:

```js
document.querySelector('button').addEventListener('click', () => {
  console.log('Someone clicked Greet!')
})
```

Now click Greet and look at the Console. The `onclick="..."` attribute in our HTML is an older, shorter way of attaching a listener.

### What really happens when you click

Clicking feels instant, but it's a chain of steps:

1. Your mouse sends a press and a release, with screen coordinates.
2. The browser asks: which element is at those coordinates? It checks layers, so whatever is on top wins. This is called **hit testing**.
3. It fires a series of events at that element: `mousedown`, `mouseup`, then `click`.
4. The event travels up through the element's parents, so the button's parents hear about the click too.
5. Any listeners run. Their code may change the DOM, and the browser redraws.

## Trusted and untrusted events

JavaScript can also fake a click:

```js
document.querySelector('button').click()
```

This runs the click listeners, but skips steps 1 and 2: no mouse, no coordinates, no check that the button is visible or on top. Every event carries a flag called `isTrusted`:

- **true**: it came from real input (mouse, keyboard, or something acting as them)
- **false**: a script made it up

Some sites ignore untrusted events, or behave differently for them, often to stop bots. This is the main reason our agent doesn't click with `element.click()`. It uses Playwright, which produces genuine, trusted mouse and keyboard input (chapter 7). The script `tutorial/04-number-and-act.js` proves it:

```
isTrusted for script click: false | for Playwright click: true
```

## Forms and typing

Text boxes, dropdowns and buttons usually live inside a `<form>`. Pressing a button with `type="submit"`, or pressing Enter in a box, **submits** the form. This is how most "search", "log in" and "place order" actions work. Our agent gives the AI a `press` action for keys like Enter, and treats clicks on submit buttons as risky (chapter 13).

## Words from this chapter

**selector**, **event**, **listener**, **hit testing**, **trusted event**, **form**. See the [glossary](../glossary.md).

Part 1 is done: you now know what an agent is looking at. Next, Part 2 controls a real browser from a program.

Next: [Programs that drive browsers](../part-2-controlling-a-browser/05-programs-that-drive-browsers.md)
