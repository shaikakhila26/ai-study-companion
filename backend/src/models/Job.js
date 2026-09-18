const mongoose = require('mongoose');

// Lightweight background-job record. This prototype runs jobs with an
// in-process async worker (see jobs/queue.js) rather than a separate
// Redis/BullMQ deployment, but the Job document itself models everything
// a real queue would need (status, attempts, retry, idempotency key) so it
// can be swapped for BullMQ/SQS later without changing calling code.
const jobSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['process_material', 'evaluate_quiz_answer', 'generate_recommendation', 'detect_repeated_mistake'],
      index: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued', index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: { type: String, default: null },
    idempotencyKey: { type: String, default: null },
    runAfter: { type: Date, default: Date.now }, // supports simple backoff
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

jobSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Job', jobSchema);
