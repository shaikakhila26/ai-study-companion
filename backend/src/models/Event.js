const mongoose = require('mongoose');

// Central event log used for activity feeds, analytics, and to trigger
// downstream learning workflows (see jobs/eventWorker.js).
const eventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
    space: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', index: true },
    type: {
      type: String,
      required: true,
      index: true,
      enum: [
        'space_created',
        'project_created',
        'material_uploaded',
        'material_processed',
        'material_failed',
        'tutor_question_asked',
        'tutor_answer_given',
        'tutor_unsupported_answer',
        'quiz_started',
        'quiz_question_answered',
        'quiz_completed',
        'mastery_updated',
        'recommendation_generated',
        'repeated_mistake_detected',
      ],
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    // idempotency: if a client-supplied key is present, duplicates are ignored
    dedupeKey: { type: String, default: null },
  },
  { timestamps: true }
);

eventSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Event', eventSchema);
