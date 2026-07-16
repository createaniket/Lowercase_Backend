// src/middlewares/photoUpload.js
// In-memory multer: we need raw buffers to hand to sharp, not disk files.
const multer = require("multer");

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 40 * 1024 * 1024, // 40MB per photo (DSLR-friendly)
    files: 500,                 // up to 500 photos per request
  },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|avif|heic|heif|tiff)$/i.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

module.exports = photoUpload;
