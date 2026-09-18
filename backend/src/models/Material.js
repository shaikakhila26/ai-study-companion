const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true },
    originalFilename: { type: String, required: true },
    storageDriver: { type: String, enum: ['local', 'cloudinary'], default: 'local' },
    storagePath: { type: String, required: true }, // local path or cloudinary URL
    mimeType: { type: String, default: 'application/pdf' },
    sizeBytes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['queued', 'processing', 'ready', 'failed'],
      default: 'queued',
      index: true,
    },
    failureReason: { type: String, default: null },
    pageCount: { type: Number, default: 0 },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Material', materialSchema);
