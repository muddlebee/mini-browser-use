# 8. Pictures for the model

::: info In this chapter
- Text lists miss things a person sees at a glance: layout, images, colours, what's grouped with what.
- Modern AI models can read images, so we also send a **screenshot**.
- We draw each element's **number on the screenshot**, so the picture and the list line up. This technique is known as **set-of-mark** prompting.
- Script: `tutorial/05-draw-labels.js`. Library: `labelledScreenshot` in `src/page.js`.
:::

## What the list can't say

Here is a list an agent might get from a shop page:

```
[4] <button> Add to cart
[5] <button> Add to cart
[6] <button> Add to cart
```

Which button belongs to the cheapest cable? The list can't say; the answer is in the *layout*, which product card each button sits in. A screenshot shows it immediately. Images, icons without text, colours ("the red warning"), and pop-ups covering the page are the same story.

## The problem with plain screenshots

If we just send a screenshot, the AI can see the right button but has no way to say which one it means: it would have to describe it, or give pixel coordinates, both of which are error-prone.

The fix: before taking the screenshot, **draw each element's number on the page**:

![The practice page with numbered labels](/images/practice-labelled.png)

Now the picture and the list use the same names. The AI sees the "Greet" button tagged **1** and says `click 1`. It reasons with its eyes and acts through numbers.

## How the labels are drawn

There's no special drawing tool: we add ordinary HTML to the page, using everything from Part 1.

1. Create one full-screen, see-through layer: a `<div>` with `position: fixed` (pinned to the viewport), the highest possible `z-index` (on top of everything), and `pointer-events: none` (clicks pass straight through it).
2. For each numbered element, read its bounding box (chapter 3) and add a box at exactly that position with a red outline, plus a small red tag showing the number.
3. Take the screenshot.
4. Remove the layer, so it never affects the real page.

```js
box.style.cssText = `position:fixed; left:${r.left}px; top:${r.top}px; width:${r.width}px; height:${r.height}px;` +
  'outline:2px solid #e11d48';
```

Run it and open the saved image:

```bash
node tutorial/05-draw-labels.js
```

The page is changed for a fraction of a second, photographed, and changed back.

## Getting the details right

Two details in the library version:

- **Labels at the top edge.** A tag sits just above its box, but a box touching the top of the screen would have its tag cut off, so there the tag goes inside the box instead.
- **The picture must match the list.** The screenshot is drawn from the boxes measured in the *same* observation that produced the text list. If we observed again just to take the picture, a moving page could shuffle the numbers between the two.

## The cost of pictures

Images are expensive for AI models: each 1280 × 800 screenshot costs roughly as much as a page or two of text, and it's sent after every action. Chapter 10 shows how the agent keeps long runs affordable. Text-only models can still work with `SCREENSHOTS=0`, using just the list.

## In the library

- `labelledScreenshot(page, boxes)` in `src/page.js` draws, captures and cleans up.
- `browser.screenshot()` observes and returns a labelled JPEG image.
- In `agent.js`, the `shot` command saves exactly the picture the AI would see.

Part 2 is complete. Our program can see a page as a numbered list and a labelled picture, and act on it with real input. All that's missing is something to make the decisions.

Next: [How language models use tools](../part-3-adding-a-brain/09-how-language-models-use-tools.md)
