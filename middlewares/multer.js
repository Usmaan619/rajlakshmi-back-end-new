const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fieldSize: 100 * 1024 * 1024 }, // 25 MB text fields
});

module.exports = upload;
