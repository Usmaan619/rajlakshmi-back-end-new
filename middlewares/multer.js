const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    fieldSize: 100 * 1024 * 1024, // 100 MB text fields (base64 bada hota hai)
  },
});

module.exports = upload;
