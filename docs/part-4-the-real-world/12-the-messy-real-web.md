# 12. The messy real web

::: info In this chapter
- **Iframes**: a page inside a page, with its own separate DOM. Common for payment forms and embedded widgets.
- **Shadow DOM**: a walled-off part of the DOM inside a component, invisible to ordinary searches.
- How the library handles both, and the problems it **doesn't** handle yet.
:::

Our practice page is simple on purpose. Real sites have a few structures that break a naive agent. Each section below says what the structure is, why it breaks things, and how the library copes.

## Iframes: a page inside a page

An `<iframe>` element shows a **whole separate web page** inside a rectangle on the current one. Card payment forms are the classic example: the shop's page embeds a form served by the payment company, for security. Maps, videos and chat widgets are often iframes too.

```
 shop.com page (its own DOM)
 ┌────────────────────────────────────────────┐
 │  Complete your booking                     │
 │                                            │
 │  ┌──── iframe: payments.com page ───────┐  │
 │  │  (a completely separate DOM)         │  │
 │  │  [ Card holder name ]  [ Confirm ]   │  │
 │  └──────────────────────────────────────┘  │
 └────────────────────────────────────────────┘
```

### Why it breaks a naive agent

`document.querySelectorAll` searches only its own document. Run it on the shop's page and the payment form's box and button simply aren't there; they live in another DOM. The agent would report "no card form" while you can see one on screen.

### How the library handles it

Playwright lists every frame in a page with `page.frames()`, and can run code in each one. So `observePage` in `src/page.js`:

1. Runs the scan in the main page.
2. For each iframe, asks Playwright where the iframe sits on screen. If it's hidden, it's skipped.
3. Runs the same scan **inside** the iframe, continuing the numbering where the main page stopped.
4. Adds the iframe's position to each element's box, so labels on the screenshot land in the right place.
5. Marks those elements in the list:

```
[0] <input type=text> Card holder name (in frame)
[1] <button> Confirm (in frame)
```

When acting, `browser.element(n)` looks for `[data-mbu="n"]` in every frame, so clicking works the same as anywhere else.

![Labels drawn inside an iframe](/images/frames-labelled.png)

## Shadow DOM: walled-off components

Modern sites are built from reusable **components**: a date picker, a signup widget, a video player. A component can hide its insides in a **shadow root**, a private sub-tree attached to an element, so the page's styles and scripts don't accidentally break it.

```
 <news-signup>                 ← an ordinary element in the page's DOM
   #shadow-root (open)         ← the wall
     <input placeholder="Email address">
     <button>Join</button>
```

You can see this in DevTools: the Elements tab shows `#shadow-root` with the contents inside it.

### Why it breaks a naive agent

`document.querySelectorAll('button')` **doesn't look behind the wall**, so the Join button isn't found.

### How the library handles it

The scan walks the tree itself: for every element, if it has an open `shadowRoot`, it searches inside that too, recursively. Playwright's selectors also see through open shadow roots, so `[data-mbu="1"]` finds the bookmark even behind the wall.

"Open" matters: a component can declare its shadow root **closed**, and then page JavaScript (including ours) can't reach inside at all. Closed shadow roots are rare. Playwright can still click on them by position, but our numbered approach can't list their insides.

## Problems the library doesn't solve yet

Being honest about limits is part of understanding a system. These are good projects once you finish the course:

| Problem | What happens now | A possible fix |
|---|---|---|
| **New tabs and pop-up windows** | a link that opens a new tab is ignored; the agent keeps looking at the old tab | listen for new pages (`context.on('page')`) and switch to them |
| **Slow pages** | the fixed 300 ms wait may be too short | wait until the network is quiet, or until the DOM stops changing |
| **Canvas apps** (some editors, games, maps) | everything is drawn as pixels inside one `<canvas>` element, so there are no elements to list | act by screen coordinates from the screenshot instead of numbers |
| **CAPTCHAs** | designed to stop automation; the agent can't pass them | hand control back to a person |
| **File uploads and downloads** | no tools for them | Playwright supports both; add tools |
| **Logins** | each run starts with a fresh, logged-out browser | save and reuse a browser profile (careful: see chapter 13) |

The eval suite (chapter 14) includes an iframe task and a shadow DOM task, so you can check these keep working as you change things.

Next: [Keeping an agent safe](./13-safety.md)
