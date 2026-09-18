const multer = require('multer');
const os = require('os');

// Files land in the OS temp dir first; materialController moves the
// accepted ones into permanent storage via storageService and deletes the
// temp copy either way (accepted or rejected).
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB cap for a prototype
});

module.exports = upload;
