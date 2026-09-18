const mongoose = require('mongoose');

const conceptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    sourceMaterials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }],
  },
  { timestamps: true }
);

conceptSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Concept', conceptSchema);
