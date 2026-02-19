const {
  uploadBase64ToS3,
  uploadBufferToS3,
  uploadMultipleBuffersToS3,
} = require("../../service/uploadFile");

exports.uploadMedia = async (req, res) => {
  try {
    const { base64 } = req.body;

    // CASE 1: Base64 upload
    if (base64) {
      const url = await uploadBase64ToS3(base64);
      return res.status(200).json({ success: true, url });
    }

    // CASE 2: Single File Upload (FormData)
    if (req.file) {
      const url = await uploadBufferToS3(req.file.buffer, req.file.mimetype);
      return res.status(200).json({ success: true, url });
    }

    // CASE 3: Multiple Files Upload (FormData)
    if (req.files && req.files.length > 0) {
      const uploadResults = [];

      for (const file of req.files) {
        const url = await uploadBufferToS3(file.buffer, file.mimetype);
        uploadResults.push(url);
      }

      return res.status(200).json({ success: true, urls: uploadResults });
    }

    return res
      .status(400)
      .json({ success: false, message: "No file provided" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to upload file",
      error: err.message,
    });
  }
};

exports.uploadMultiple = async (req, res) => {
  try {
    const { files } = req.body;
    // files: [{ base64: "...", mimetype: "image/png" }, ...]

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: "files required" });
    }

    const parsedFiles = files.map((f) => {
      const parts = f.base64.match(/^data:(.+);base64,(.+)$/);
      return {
        mimetype: parts[1],
        buffer: Buffer.from(parts[2], "base64"),
      };
    });

    const uploaded = await uploadMultipleBuffersToS3(parsedFiles);

    res.json({ success: true, files: uploaded });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Upload failed" });
  }
};
