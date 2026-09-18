const asyncHandler = require('express-async-handler');
const fs = require('fs');
const Material = require('../models/Material');
const { saveFile } = require('../services/storageService');
const { logEvent } = require('../services/eventService');
const { enqueue } = require('../jobs/queue');

const uploadMaterial = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded. Attach a PDF under field name "file".');
  }
  if (req.file.mimetype !== 'application/pdf') {
    fs.unlinkSync(req.file.path);
    res.status(400);
    throw new Error('Only PDF files are supported in this prototype.');
  }

  const { storagePath, storageDriver } = await saveFile(req.file.path, req.file.originalname);
  fs.unlinkSync(req.file.path); // clean up multer's temp file now that it's been persisted

  const material = await Material.create({
    user: req.user._id,
    project: req.project._id,
    title: req.body.title || req.file.originalname.replace(/\.pdf$/i, ''),
    originalFilename: req.file.originalname,
    storageDriver,
    storagePath,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    status: 'queued',
  });

  await logEvent({
    user: req.user._id,
    project: req.project._id,
    type: 'material_uploaded',
    payload: { materialId: material._id, title: material.title },
  });

  // Asynchronous processing (PRD section 5) -- upload returns immediately.
  await enqueue(
    'process_material',
    { materialId: material._id.toString() },
    { idempotencyKey: `process_material:${material._id}` }
  );

  res.status(201).json({ material });
});

const listMaterials = asyncHandler(async (req, res) => {
  const materials = await Material.find({ project: req.project._id }).sort({ createdAt: -1 }).lean();
  res.json({ materials });
});

const getMaterialStatus = asyncHandler(async (req, res) => {
  const material = await Material.findOne({ _id: req.params.materialId, project: req.project._id }).lean();
  if (!material) {
    res.status(404);
    throw new Error('Material not found');
  }
  res.json({ material });
});

module.exports = { uploadMaterial, listMaterials, getMaterialStatus };
