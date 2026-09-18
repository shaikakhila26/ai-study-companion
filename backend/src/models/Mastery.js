const mongoose = require('mongoose');

const masteryHistoryPointSchema = new mongoose.Schema(
  {
    value: { type: Number, required: true },
    reason: { type: String, default: '' }, // e.g. 'quiz_correct', 'quiz_incorrect', 'tutor_session'
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const masterySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    concept: { type: mongoose.Schema.Types.ObjectId, ref: 'Concept', required: true, index: true },
    conceptName: { type: String, required: true },
    level: { type: Number, default: 0.3, min: 0, max: 1 }, // 0..1 estimated mastery
    confidence: { type: Number, default: 0.2, min: 0, max: 1 }, // how much evidence backs the estimate
    attemptsCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    consecutiveMistakes: { type: Number, default: 0 },
    trend: { type: String, enum: ['improving', 'stable', 'attention'], default: 'stable' },
    history: [masteryHistoryPointSchema],
    lastEvidenceAt: { type: Date, default: null },
  },
  { timestamps: true }
);

masterySchema.index({ project: 1, concept: 1 }, { unique: true });

module.exports = mongoose.model('Mastery', masterySchema);
