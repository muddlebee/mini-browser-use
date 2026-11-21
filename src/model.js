// Turn "provider:model-id" into a model object any AI SDK function accepts.
const { createProviderRegistry } = require('ai');
const { anthropic } = require('@ai-sdk/anthropic');
const { openai } = require('@ai-sdk/openai');
const { google } = require('@ai-sdk/google');
const { createOpenAICompatible } = require('@ai-sdk/openai-compatible');

const DEFAULT_MODEL = 'anthropic:claude-opus-5-5';

// Each provider reads its own key: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY.
// "custom" is any OpenAI-compatible server (OpenRouter, Ollama, LM Studio, Groq, ...).
function buildRegistry() {
  const providers = { anthropic, openai, google };
  if (process.env.CUSTOM_BASE_URL) {
    providers.custom = createOpenAICompatible({
      name: 'custom',
      baseURL: process.env.CUSTOM_BASE_URL,
      apiKey: process.env.CUSTOM_API_KEY,
    });
  }
  return createProviderRegistry(providers);
}

// Accepts a "provider:model-id" string, or a model object you built yourself (passed through).
/**
 * @param {string | import('ai').LanguageModel} [model]
 * @returns {import('ai').LanguageModel}
 */
function resolveModel(model = process.env.MODEL || DEFAULT_MODEL) {
  if (typeof model !== 'string') return model;
  // The id is only known at run time, so it can't match the SDK's list of known model ids.
  return buildRegistry().languageModel(/** @type {any} */ (model));
}

module.exports = { resolveModel, DEFAULT_MODEL };
