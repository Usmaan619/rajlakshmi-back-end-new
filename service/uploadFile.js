const imagekit = require("../config/imagekit");

// ===================== DELETE (by ImageKit URL) =====================
exports.deleteFromS3 = async (fileUrl) => {
  try {
    if (!fileUrl || typeof fileUrl !== "string") return;

    // Sirf ImageKit URLs ko process karo
    if (!fileUrl.includes("ik.imagekit.io")) {
      console.log("Skipping delete for non-ImageKit URL:", fileUrl);
      return;
    }

    // URL se filename extract karo
    let urlObj;
    try {
      urlObj = new URL(fileUrl);
    } catch {
      console.log("Invalid URL format, skipping delete:", fileUrl);
      return;
    }

    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    const fileName = pathParts[pathParts.length - 1];

    // ImageKit mein search karke fileId se delete karo
    const result = await imagekit.assets.list({
      searchQuery: `name="${fileName}"`,
    });

    const files = result?.data || result || [];
    if (files.length > 0) {
      await imagekit.files.delete(files[0].fileId);
      console.log("Old image deleted from ImageKit:", fileName);
    } else {
      console.log("File not found in ImageKit, skipping delete:", fileName);
    }
  } catch (err) {
    // Delete fail ho toh bhi upload continue kare — critical error nahi hai
    console.log("Delete error (non-fatal):", err.message);
  }
};

// ===================== uploadBufferToS3 =====================
exports.uploadBufferToS3 = async (buffer, mimetype) => {
  return uploadToImageKit(buffer, "uploads");
};

// ===================== uploadProductImage =====================
exports.uploadProductImage = async (buffer, mimetype, product_id) => {
  return uploadToImageKit(buffer, `products/${product_id}`);
};

// ===================== uploadBufferAndReelsToS3 =====================
exports.uploadBufferAndReelsToS3 = async (buffer, mimetype) => {
  return uploadToImageKit(buffer, "reels");
};

// ===================== uploadBufferAndBlogsToS3 =====================
exports.uploadBufferAndBlogsToS3 = async (buffer, mimetype) => {
  return uploadToImageKit(buffer, "blogs");
};

// ===================== uploadMultipleBuffersToS3 =====================
exports.uploadMultipleBuffersToS3 = async (files) => {
  return Promise.all(
    files.map((file) => uploadToImageKit(file.buffer, "uploads")),
  );
};

// ===================== uploadBase64ToS3 =====================
exports.uploadBase64ToS3 = async (base64) => {
  const result = await imagekit.files.upload({
    file: base64,
    fileName: `upload_${Date.now()}`,
    folder: "uploads",
    useUniqueFileName: true,
  });
  return result.url;
};

// ===================== CORE uploader =====================
async function uploadToImageKit(buffer, folder) {
  const base64 = buffer.toString("base64");
  const result = await imagekit.files.upload({
    file: base64,
    fileName: `img_${Date.now()}`,
    folder: folder,
    useUniqueFileName: true,
  });
  return result.url;
}
