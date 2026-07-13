const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB per file
    fieldSize: 150 * 1024 * 1024, // 150 MB text fields (base64 is larger)
  },
});

module.exports = upload;
