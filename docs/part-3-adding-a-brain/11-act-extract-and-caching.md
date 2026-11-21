# 11. act, extract and caching

::: info In this chapter
- `agent(goal)` hands a whole task to the model. Often you want **less** freedom.
- `act(instruction)` does **one** thing: "click the login button".
- `extract(instruction, schema)` reads data off the page **into a fixed shape**.
- **Caching** lets `act` repeat a step without calling the model at all.
:::

## Three levels of control

| You know... | Use | Example |
|---|---|---|
| nothing about the steps | `agent` | "Find the cheapest cable and add it to the cart" |
| the steps, not the page details | `act` | "click the login button", "type my email into the email box" |
| what data you want | `extract` | "the price and name of the first result" |

Mixing them gives you a script that is predictable where you want and flexible where you need:

```js
await browser.goto('test.html');
await browser.act('type "Ada" into the name box');
await browser.act('press the Greet button');
const greeting = await browser.extract('the greeting', z.object({ message: z.string(), name: z.string() }));
// { message: 'Hello Ada', name: 'Ada' }
```

## act: one instruction

`act` runs the same loop as `agent`, with two changes:

- a different instruction: *carry out exactly this and nothing more, then call done*
- a smaller step limit (5)

So "press the Greet button" presses the button and stops; it doesn't wander off doing more.

## extract: data in a fixed shape

`extract` doesn't act at all. It sends the page's visible text, plus a screenshot, with a **schema** saying exactly what to return, and the AI SDK's structured output makes the model fill it in:

```js
const product = await browser.extract(
  'the cheapest product',
  z.object({ name: z.string(), price: z.number() }),
);
// { name: 'Cable C', price: 4.99 }
```

The result is checked against the schema, so `price` is really a number your code can compare or add up, not a sentence. Leave out the schema to get a plain string back.

## Caching: remembering how it was done

Automations often repeat the same steps every day: log in, open a report, download it. Asking the model each time is slow and costs money, even though the answer is always the same.

With `Browser.launch({ cache: true })` (or a file path, to keep it between runs), a successful `act` is remembered:

```
key:   file:///.../test.html :: type "ada" into the name box
steps: [ { action: "type", target: "<input type=text> Your name", input: { text: "Ada" } } ]
```

Next time the same instruction runs on the same page, it **replays** without calling the model. In our test that took 0.7 seconds, with no model calls.

### Remembering elements by description, not number

Numbers change between visits, so the cache stores each element's **description** (`<input type=text> Your name`). On replay it observes the page and finds the element with that description.

If several elements share a description (three "Add to cart" buttons), it also stores which one it was: the first, second or third with that description.

### When the page has changed

If the remembered element can't be found, say the site was redesigned, the replay stops, the old entry is thrown away, and the model is asked again. The fresh result is cached for next time. Caching never makes things fail; at worst it costs one wasted look.

Only clean runs are cached: the model reported success and every action worked.

Part 3 is complete: a working AI browser agent with three levels of control. Part 4 is about what makes real websites hard, and how to keep an agent safe.

Next: [The messy real web](../part-4-the-real-world/12-the-messy-real-web.md)
