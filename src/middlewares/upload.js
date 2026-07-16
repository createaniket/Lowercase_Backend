// src/middlewares/upload.js

const multer = require("multer");
const fs = require("fs");
const path = require("path");

// ✅ Absolute path (NO MORE ERRORS)
const uploadPath = path.join(__dirname, "../../uploads");

// 🔥 Create folder if not exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

module.exports = upload;