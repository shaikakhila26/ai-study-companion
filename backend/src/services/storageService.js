const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');
const env = require('../config/env');

const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(LOCAL_UPLOAD_DIR)) fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });

// Thin storage abstraction so the rest of the app never needs to know
// whether files live on local disk or in Cloudinary. Only `local` is
// implemented end-to-end here (no external network access assumed); the
// cloudinary branch is stubbed with a clear TODO so swapping providers is a
// one-file change, matching the "candidate may choose technologies" intent.
async function saveFile(tmpFilePath, originalFilename) {
  if (env.storageDriver === 'cloudinary') {
    throw new Error(
      'Cloudinary storage selected but not configured in this prototype. Set STORAGE_DRIVER=local, ' +
        'or implement services/storageService.js#saveFile using the cloudinary SDK with your credentials.'
    );
  }

  const ext = path.extname(originalFilename) || '.pdf';
  const destName = `${uuid()}${ext}`;
  const destPath = path.join(LOCAL_UPLOAD_DIR, destName);
  fs.copyFileSync(tmpFilePath, destPath);
  return { storagePath: destPath, storageDriver: 'local' };
}

function readFile(storagePath) {
  return storagePath; // for local driver, storagePath already is the file path
}

module.exports = { saveFile, readFile, LOCAL_UPLOAD_DIR };
