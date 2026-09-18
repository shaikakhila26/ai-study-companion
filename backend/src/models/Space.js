const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#6366f1' },
    icon: { type: String, default: 'book' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Space', spaceSchema);
