const mongoose = require('mongoose');

// Observability record for every AI call: what feature triggered it, which
// model, how long it took, how many tokens, estimated cost, and outcome.
const aiUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
    feature: {
      type: String,
      required: true,
      enum: ['tutor', 'quiz_generation', 'quiz_grading', 'recommendation', 'concept_extraction', 'eval'],
      index: true,
    },
    provider: { type: String, default: 'groq' },
    model: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, required: true },
    estimatedCostUsd: { type: Number, default: 0 },
    success: { type: Boolean, required: true },
    errorMessage: { type: String, default: null },
    retrievalChunkCount: { type: Number, default: null },
    retrievalTopScore: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIUsage', aiUsageSchema);
