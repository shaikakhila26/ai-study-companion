const mongoose = require('mongoose');

// A searchable unit of a Material. Retrieval uses TF-IDF style term vectors
// built lazily at query-time from `text` + a precomputed term-frequency map,
// which keeps this prototype self-contained (no external embedding API).
const chunkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
    materialTitle: { type: String, required: true },
    page: { type: Number, default: null },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    termFreq: { type: Map, of: Number, default: {} }, // token -> count, for TF-IDF scoring
    concepts: [{ type: String }],
  },
  { timestamps: true }
);

chunkSchema.index({ project: 1, material: 1, chunkIndex: 1 });

module.exports = mongoose.model('Chunk', chunkSchema);
