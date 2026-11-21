# 3. How a browser draws a page

::: info In this chapter
- The steps from "text arrives" to "pixels on screen": **parse, style, layout, paint**.
- **Layout** gives every element a box with a position and size in pixels. Our agent uses those boxes to know what is visible and where to click.
- The **viewport** is the part of the page currently on screen. Anything outside it has to be scrolled to.
:::

## The pipeline

Every time you open a page, the browser runs roughly these steps:

```
 HTML text ──► 1. PARSE ──► DOM tree
                                │
 CSS rules ──► 2. STYLE ────────┤  work out the final look of every element
                                │
               3. LAYOUT ───────┤  work out where every element goes, in pixels
                                │
               4. PAINT ────────┘  colour in the pixels on screen
```

1. **Parse.** Read the HTML text and build the DOM tree (chapter 2).
2. **Style.** For each element, collect every CSS rule that applies and settle on its final look: colour, font, size, and whether it is displayed at all.
3. **Layout.** Work out the geometry. Every visible element gets a rectangle: how far from the left, how far from the top, how wide, how tall. Text wraps, boxes stack, columns form.
4. **Paint.** Fill in the actual pixels.

When JavaScript changes the DOM (like writing "Hello Ada"), the browser repeats the steps it needs to. That's why the page updates instantly.

## Every element is a box

After layout, everything on screen is a rectangle, even round buttons and text. You can ask the browser for any element's rectangle. It's called the **bounding box** and has four numbers:

```
 (0,0) ─────────────── x grows to the right ──►
   │
   │        x=197, y=80
   │        ┌──────────┐
   y        │  Greet   │  height = 21
 grows      └──────────┘
 down          width = 49
   │
   ▼
```

- **x**: pixels from the left edge of the window
- **y**: pixels from the top edge (y grows **downwards**, unlike in school maths)
- **width** and **height**

Those numbers for the Greet button are real: they come from running `tutorial/03-find-elements.js` (chapter 6).

::: tip Try it
In DevTools, click the **Console** tab, paste this and press Enter:
```js
document.querySelector('button').getBoundingClientRect()
```
You get the Greet button's box: its x, y, width and height. The `<button style="display:none">` gives all zeros, because it was never laid out.
:::

## Visible or not?

An element can be in the DOM yet invisible. The common reasons:

| Reason | What the browser sees |
|---|---|
| `display: none` in its CSS | not laid out at all: its box is 0 × 0 |
| `visibility: hidden` | laid out (takes space) but not painted |
| zero width or height | nothing to see |
| off screen | laid out, but outside the part of the page on screen |
| covered by something else | painted, but another element sits on top (a pop-up, a cookie banner) |

Our agent checks the first four directly. The last one, being covered, it leaves to the click itself: Playwright refuses to click an element that something else is covering, and the agent is told the click failed (chapter 7).

## The viewport and scrolling

A page can be much taller than your screen. The part you can currently see is the **viewport**: in our agent it's a window 1280 pixels wide and 800 tall.

```
 ┌───────────────────────────┐
 │   top of the page         │  ← scrolled past (above the viewport)
 ├───────────────────────────┤
 │                           │
 │   VIEWPORT                │  ← what is on screen now
 │   (1280 × 800)            │
 │                           │
 ├───────────────────────────┤
 │   rest of the page        │  ← below the viewport: scroll to see it
 │   ...                     │
 └───────────────────────────┘
```

Bounding boxes are measured from the top-left of the **viewport**, not of the page. So an element below the fold has a `y` bigger than 800, and one you scrolled past has a negative `y`. Our agent only lists elements inside the viewport, exactly like a person can only click what's on screen, and gives the AI a "scroll" action to see more. One of the eval tasks (chapter 14) is a button 3000 pixels down a page.

## Layers: what is on top

Elements can overlap. CSS has a setting called `z-index` that decides which is on top, like sheets of paper on a desk. We use this in chapter 8: to draw numbered labels over the page, we add a layer with the highest possible `z-index`, so our labels sit above everything else.

## Why this matters for an agent

- **Visibility** decides what goes on the agent's list.
- **Bounding boxes** say where each element is, so we can draw labels on screenshots.
- **The viewport** is why the agent needs to scroll.
- **Re-layout after changes** is why the agent waits a moment after each action before looking again.

## Words from this chapter

**parse**, **layout**, **paint**, **bounding box**, **viewport**, **z-index**. See the [glossary](../glossary.md).

Next: [JavaScript and events](./04-javascript-and-events.md)
