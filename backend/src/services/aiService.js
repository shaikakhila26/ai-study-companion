const Groq = require('groq-sdk');
const env = require('../config/env');
const AIUsage = require('../models/AIUsage');

let client = null;
function getClient() {
  if (!client) {
    if (!env.groqApiKey) {
      throw new Error('GROQ_API_KEY is not set. Add it to backend/.env to enable AI features.');
    }
    client = new Groq({ apiKey: env.groqApiKey });
  }
  return client;
}

// Very rough Groq pricing estimate for observability purposes only (not
// billing-accurate). Keeping this centralized means the cost column in
// AIUsage/analytics is at least directionally comparable across features.
const COST_PER_1K_TOKENS_USD = 0.00059; // approx blended rate for llama-3.3-70b on Groq

function estimateCost(totalTokens) {
  return Number(((totalTokens / 1000) * COST_PER_1K_TOKENS_USD).toFixed(6));
}

/**
 * Core wrapper around every Groq chat completion call in the app.
 * Every AI operation in the system MUST go through this function so that
 * latency, token usage, cost, and success/failure are uniformly observable
 * (PRD section 14 requires this).
 */
async function chatComplete({
  feature,
  user,
  project,
  messages,
  model,
  temperature = 0.3,
  maxTokens = 1024,
  responseFormat = null, // { type: 'json_object' } for structured generation
  tools = null,
  toolChoice = undefined,
  retrievalChunkCount = null,
  retrievalTopScore = null,
}) {
  const start = Date.now();
  const usedModel = model || env.groqModel;

  try {
    const completion = await getClient().chat.completions.create({
      model: usedModel,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat ? { response_format: responseFormat } : {}),
      ...(tools ? { tools, tool_choice: toolChoice || 'auto' } : {}),
    });

    const latencyMs = Date.now() - start;
    const usage = completion.usage || {};

    await AIUsage.create({
      user: user || null,
      project: project || null,
      feature,
      model: usedModel,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      latencyMs,
      estimatedCostUsd: estimateCost(usage.total_tokens || 0),
      success: true,
      retrievalChunkCount,
      retrievalTopScore,
    });

    return completion.choices[0].message;
  } catch (err) {
    const latencyMs = Date.now() - start;
    await AIUsage.create({
      user: user || null,
      project: project || null,
      feature,
      model: usedModel,
      latencyMs,
      success: false,
      errorMessage: err.message,
      retrievalChunkCount,
      retrievalTopScore,
    }).catch(() => {}); // never let logging failure mask the original error
    throw err;
  }
}

module.exports = { chatComplete, estimateCost };
