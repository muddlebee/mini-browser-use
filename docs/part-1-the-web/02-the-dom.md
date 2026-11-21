# 2. The DOM: the page as a tree

::: info In this chapter
- When a browser reads HTML, it builds a structure in memory called the **DOM**.
- The DOM is a tree of objects, one per element, and it is **live**: it changes while you use the page.
- Our agent never reads the HTML file. It reads the DOM.
:::

## From text to objects

HTML is text. Text is awkward to work with: to change a heading you would have to find the right characters and rewrite them. So when a browser loads a page, it reads the HTML once and builds a structure of **objects** in memory: one object for every element, each knowing its tag, its attributes, its text, and which elements are inside it.

That structure is the **Document Object Model**, or **DOM**:

- **Document**: the page.
- **Object**: each element becomes an object, a bundle of information plus things you can do with it.
- **Model**: it represents the page.

From then on the browser works from the DOM, not the HTML. When it draws the page, it draws the DOM. When JavaScript changes the page, it changes the DOM.

## The DOM is a tree

Because elements sit inside elements, the DOM is shaped like a family tree, drawn upside down:

```
document
└── html
    ├── head
    │   └── title
    └── body
        ├── h1
        ├── input
        ├── button
        ├── p
        ├── a
        └── button
```

The family words are used literally:

- `body` is the **parent** of `h1`.
- `h1`, `input`, `button`... are **children** of `body`, and **siblings** of each other.
- Everything inside `body`, at any depth, is a **descendant** of `body`.

Each box in the tree is called a **node**. Elements are nodes; so are pieces of text (the "Hi" inside `<h1>` is a text node). In this course "element" is enough.

## The DOM is live

The HTML file is fixed. The DOM changes all the time:

- You type in a box: the input element's value changes.
- You press Greet: JavaScript puts "Hello Ada" into the paragraph.
- A modern site (built with tools like React) adds, removes and replaces whole sections as you click around, often without loading a new page at all.

This is why our agent must look again after every action. A list of buttons from a second ago may already be wrong. It is also why the agent reads the DOM rather than downloading the HTML: the HTML tells you what the page looked like when it arrived, and the DOM tells you what it looks like **now**.

## See the DOM yourself: DevTools

Chrome has a built-in toolkit for looking inside pages, called **DevTools**. It is the single most useful tool for learning this subject.

1. Open `test.html` in Chrome.
2. Press **F12** (or right-click the page and choose **Inspect**).
3. Choose the **Elements** tab.

You see the DOM as an expandable tree. Click the small triangles to open and close parents.

::: tip Try it
- Hover over lines in the Elements tab. Chrome highlights that element on the page, with its size.
- Right-click the "Greet" button **on the page** and choose Inspect. DevTools jumps to that element in the tree.
- Type Ada and press Greet. Watch the `<p id="o">` line: "Hello Ada" appears inside it. The DOM changed; the file on disk did not.
- Double-click the "Hi" text in the Elements tab, type something else, and press Enter. The page changes instantly. You just edited the DOM by hand.
:::

Refresh the page and your edits vanish, because the browser rebuilds the DOM from the HTML file.

## Why this matters for an agent

Everything an agent does is reading or changing the DOM:

| The agent wants to... | In DOM terms |
|---|---|
| know what is on the page | walk the tree and list the useful elements |
| type a name | set the value of an input element |
| press a button | click a button element |
| read the result | read the text of an element |

The agent never sees HTML text. It asks the browser about the live DOM, every step.

## Words from this chapter

**DOM**, **node**, **parent**, **child**, **DevTools**. See the [glossary](../glossary.md).

Next: [How a browser draws a page](./03-how-a-browser-draws-a-page.md)
