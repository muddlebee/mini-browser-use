// Course: chapter 11.
// Read information off the current page and return it as typed data, validated by a zod schema.
const { generateText, Output } = require('ai');
const { z } = require('zod');
const { resolveModel } = require('./model');

const INSTRUCTIONS = `You extract information from a web page. Use only what is on the page.
If something asked for is not there, say so in the relevant field rather than inventing it.`;

/**
 * @param {import('./browser').Browser} browser
 * @param {string} instruction
 * @param {import('zod').ZodType} [schema]
 * @param {{ model?: string | import('ai').LanguageModel, screenshots?: boolean }} [options]
 */
async function runExtract(browser, instruction, schema, { model, screenshots = true } = {}) {
  // Without a schema, return a plain string.
  const usedSchema = schema ?? z.object({ value: z.string() });
  const state = await browser.observe();
  /** @type {Array<import('ai').TextPart | import('ai').FilePart>} */
  const content = [{
    type: 'text',
    text: `Extract: ${instruction}\n\nURL: ${state.url}\nTitle: ${state.title}\n\nPage text:\n${await browser.text(20000)}`,
  }];
  if (screenshots) {
    const jpeg = await browser.page.screenshot({ type: 'jpeg', quality: 70 });
    content.push({ type: 'file', mediaType: 'image/jpeg', data: { type: 'data', data: jpeg.toString('base64') } });
  }
  const { output } = await generateText({
    model: resolveModel(model),
    instructions: INSTRUCTIONS,
    messages: [{ role: 'user', content }],
    output: Output.object({ schema: usedSchema }),
  });
  return schema ? output : output.value;
}

module.exports = { runExtract };
