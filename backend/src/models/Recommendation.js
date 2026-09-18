const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    text: { type: String, required: true },
    reasonTags: [{ type: String }], // e.g. ['weak_concept:Concept C', 'repeated_mistake']
    relatedConcepts: [{ type: String }],
    status: { type: String, enum: ['active', 'dismissed', 'completed', 'superseded'], default: 'active' },
    priority: { type: Number, default: 0.5 }, // 0..1
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recommendation', recommendationSchema);
