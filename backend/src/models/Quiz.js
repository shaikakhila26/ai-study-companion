const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['mcq', 'open'], required: true },
    concept: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    prompt: { type: String, required: true },
    options: [{ type: String }], // for mcq
    correctOptionIndex: { type: Number }, // for mcq
    modelAnswer: { type: String }, // for open, used as grading reference
    citedMaterial: { type: String, default: null },

    // Answer + evaluation
    userAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
    isCorrect: { type: Boolean, default: null }, // mcq: exact; open: judged "understood"
    score: { type: Number, default: null }, // 0..1, mainly for open questions
    feedback: { type: String, default: null }, // what was understood / missing
    missingConcepts: [{ type: String }],
    answeredAt: { type: Date, default: null },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    questions: [questionSchema],
    currentIndex: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    summary: {
      totalQuestions: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      averageScore: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
