const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    citations: [
      {
        materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
        materialTitle: String,
        page: Number,
        snippet: String,
      },
    ],
    unsupported: { type: Boolean, default: false }, // true if answered "insufficient evidence"
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// One Conversation per Project keeps continuity without a global history blob.
// Only a rolling window + summary is sent to the AI per request (see tutorService).
const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true, unique: true },
    summary: { type: String, default: '' }, // rolling summary of older turns
    messages: [messageSchema], // recent window only; older turns get folded into `summary`
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
