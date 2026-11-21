# 9. How language models use tools

::: info In this chapter
- A **language model** (LLM) reads text (and images) and writes text back. It can't click anything itself.
- A conversation is a list of **messages**. The model remembers nothing between calls, so we resend the whole list every time.
- **Tools** let a model ask *us* to do things: we describe a menu of actions; it replies with a structured request; our code carries it out.
- Script: `tutorial/06-first-tool-call.js` (needs an API key; see [setup](../setup.md)).
:::

## What a language model is, for our purposes

A large language model, such as Claude, GPT or Gemini, is a program that takes text in and produces text out. You've used one if you've chatted with an AI assistant. Many can also take images in.

It runs on the provider's servers. Our program sends it a request over the internet with an **API key** (a password identifying your account) and gets a reply.

What it *can't* do is reach into your computer. It has no browser, no mouse, no files. It can only write text. So how can it click a button?

## Messages and memory

A request contains a **conversation**: a list of messages, each with a role.

| Role | Who wrote it | Example |
|---|---|---|
| system | the program's standing rules | "You operate a web browser..." |
| user | the person (or our program, on their behalf) | "Goal: greet Ada. [page state]" |
| assistant | the model's earlier replies | "I'll type Ada first." |
| tool | results of actions the model asked for | "ok. [new page state]" |

The model has **no memory between requests**. Each call, it reads the whole list from the top and writes the next reply. If we want it to remember that it already typed "Ada", that fact must be in the list we send. This is why an agent resends the growing conversation every step, and why long conversations get expensive (chapter 10).

## Tools: a menu the model can order from

**Tool calling** (also called function calling) is the feature that makes agents possible. Along with the messages, we send a menu of actions. Each has:

- a **name**: `click`
- a **description** in plain words: "Click an element."
- a **schema**: the exact shape of the details it needs, e.g. `{ element: number }`

Instead of answering in prose, the model can reply with a **tool call**, a structured request like:

```json
{ "tool": "type", "input": { "element": 0, "text": "Ada" } }
```

Nothing has happened yet: the model only *asked*. Our program reads the request, does the typing with Playwright, and sends back a **tool result** ("ok", plus the new page state). The model reads that on its next turn.

```
 our program                                    the model
     │  messages + menu of tools                    │
     ├─────────────────────────────────────────────►│
     │                tool call: type 0 "Ada"       │
     │◄─────────────────────────────────────────────┤
  (Playwright types)                                │
     │  tool result: ok + new page state            │
     ├─────────────────────────────────────────────►│
     │                tool call: click 1            │
     │◄─────────────────────────────────────────────┤
    ...                                            ...
```

The schema is what makes this dependable: the model's request always comes back in a shape our code can run, never a vague sentence we'd have to interpret.

## Script 6: the first tool call

`tutorial/06-first-tool-call.js` sends a fake page description and two tools, and prints what the model chooses. There's no browser yet; it's just the model's side.

```js
const result = await generateText({
  model: resolveModel(),               // e.g. anthropic:claude-opus-5-5, from .env
  tools: {
    click: tool({
      description: 'Click an element on the page.',
      inputSchema: z.object({ element: z.number().describe('The element number') }),
    }),
    type: tool({
      description: 'Type text into a text box.',
      inputSchema: z.object({ element: z.number(), text: z.string() }),
    }),
  },
  prompt: `Goal: greet Ada.
The page has these elements:
[0] <input> Your name
[1] <button> Greet
What should be done first?`,
});
```

```bash
node tutorial/06-first-tool-call.js
```

```
The model wrote: First I'll type "Ada" into the name field.
The model chose: type {"element":0,"text":"Ada"}
```

It picked the right element and filled in the details in exactly the shape we asked for.

## One code, many providers: the AI SDK

Every AI company formats requests, tools and images slightly differently. We use the **Vercel AI SDK** (the `ai` package), which hides those differences:

- `tool({ description, inputSchema, execute })` defines a tool once.
- `generateText({ model, messages, tools })` calls any provider.
- `z.object(...)` comes from **zod**, a library for describing data shapes. The SDK turns it into each provider's schema format, and checks the model's answers against it.

The model is chosen with a string like `anthropic:claude-opus-5-5`, `openai:...`, `google:...`, or `custom:...` for any OpenAI-compatible server such as OpenRouter or a local Ollama. `src/model.js` turns that string into a model object. Switching provider is one line in `.env`.

Next: [The agent loop](./10-the-agent-loop.md)
