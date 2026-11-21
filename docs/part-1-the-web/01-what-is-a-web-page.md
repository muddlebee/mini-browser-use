# 1. What is a web page?

::: info In this chapter
- A web page is a text file written in a language called **HTML**.
- HTML is made of **elements**: a heading, a paragraph, a button, a link.
- Two more languages finish the job: **CSS** decides how things look, and **JavaScript** makes things happen.
:::

## A web page is just text

Open the file `test.html` from this project in a text editor (Notepad works). This is all of it:

```html
<!doctype html>
<html>
  <head>
    <title>Test</title>
  </head>
  <body>
    <h1>Hi</h1>
    <input placeholder="Your name" id="n">
    <button onclick="document.getElementById('o').innerText = 'Hello ' + n.value">Greet</button>
    <p id="o"></p>
    <a href="https://example.com">Example</a>
    <button style="display:none">hidden</button>
  </body>
</html>
```

Now open the same file in Chrome (drag it onto a Chrome window). You see this:

![The practice page in a browser](/images/practice-page.png)

The file is instructions; the browser follows them and draws the result. Every website you have ever used, however fancy, reaches your browser in this same form: text in the HTML language.

This tiny page is the practice page for the whole course. By the end, an AI will read it, type a name into the box, press the button, and tell you what happened.

## Tags and elements

HTML marks up text with **tags**: words in angle brackets. Most come in pairs, an opening tag and a closing tag with a slash:

```html
<h1>Hi</h1>
```

- `<h1>` opens a top-level **h**eading.
- `</h1>` closes it.
- `Hi` is the content in between.

The whole thing, opening tag, content and closing tag, is called an **element**. Some elements have nothing inside them, so they have no closing tag; `<input>` (a box you can type into) is one.

The elements on our practice page:

| Element | What it is | What you see |
|---|---|---|
| `<h1>` | a big heading | "Hi" in large bold text |
| `<input>` | a text box | the empty box |
| `<button>` | a button | "Greet" |
| `<p>` | a paragraph | nothing yet; it is empty until you press Greet |
| `<a>` | a link (the "a" stands for anchor) | "Example", underlined |

There are about a hundred kinds of element, but a dozen cover most of what an agent needs: headings, paragraphs, links, buttons, text boxes, dropdowns (`<select>`), images (`<img>`), lists, tables, and plain boxes used for layout (`<div>` and `<span>`).

## Attributes: extra details on an element

Inside an opening tag you can add **attributes**, written `name="value"`:

```html
<input placeholder="Your name" id="n">
<a href="https://example.com">Example</a>
```

- `placeholder="Your name"` is the grey hint text shown in an empty box.
- `id="n"` gives the element a name, so code can find it. An id should be unique on the page.
- `href="https://example.com"` is where a link goes ("hypertext reference").

Remember attributes. Our agent will later invent one of its own, `data-mbu`, and stick it onto elements as a bookmark.

## Elements inside elements

Elements can contain other elements. Our page is a set of boxes inside boxes:

```
html
├── head
│   └── title  "Test"
└── body
    ├── h1      "Hi"
    ├── input
    ├── button  "Greet"
    ├── p
    ├── a       "Example"
    └── button  "hidden"
```

- `<html>` wraps everything.
- `<head>` holds information about the page that isn't drawn, like the title shown on the browser tab.
- `<body>` holds everything you see.

The indentation in the HTML file is only for humans; the browser ignores it. What matters is which element is inside which. This "inside" relationship is so important it gets its own chapter next.

## CSS: how things look

Look at the last line of the body:

```html
<button style="display:none">hidden</button>
```

There is a second button on the page, but you can't see it. The `style` attribute holds **CSS** (Cascading Style Sheets), the language for appearance: colours, sizes, fonts, positions, and whether something is shown at all. `display:none` means "don't draw this".

This matters enormously for an agent. The HTML contains a button that no person can see or click. If our agent told the AI "there is a button called hidden", the AI might try to click something impossible. So our agent must check not just what is in the HTML, but what is actually visible. Chapter 3 explains how the browser works that out.

CSS usually lives in a separate file or a `<style>` block rather than on each element, but the idea is the same: rules that say how elements look.

## JavaScript: making things happen

The Greet button has one more attribute:

```html
<button onclick="document.getElementById('o').innerText = 'Hello ' + n.value">Greet</button>
```

The value of `onclick` is **JavaScript**, a programming language that runs inside the browser. In plain words this line says: "when this button is clicked, find the element with id `o` (the empty paragraph) and set its text to 'Hello ' followed by whatever is in the box with id `n`."

Type Ada and press Greet, and "Hello Ada" appears. The HTML file never changes on disk; the JavaScript changed the page **in the browser's memory**. That is the key to the next chapter.

## The three languages together

| Language | Job | Analogy |
|---|---|---|
| HTML | what is on the page | the walls and furniture of a house |
| CSS | how it looks | paint, sizes, where furniture stands |
| JavaScript | what it does | the electricity: switches, doorbells |

## Try it yourself

1. Open `test.html` in Notepad. Change `<h1>Hi</h1>` to `<h1>Hello world</h1>`, save, and refresh Chrome. The heading changes.
2. Delete `style="display:none"` from the last button, save, refresh. The hidden button appears.
3. Undo both changes (the tests in this project expect the original file).

## Words from this chapter

**HTML**, **tag**, **element**, **attribute**, **CSS**, **JavaScript**. Each is in the [glossary](../glossary.md).

Next: [The DOM, the page as a tree](./02-the-dom.md)
