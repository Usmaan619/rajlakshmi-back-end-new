// const cloudinary = require("../config/cloudinary");
// const { v4: uuid } = require("uuid");

// // ===================== DELETE (by URL) =====================
// exports.deleteFromS3 = async (fileUrl) => {
//   try {
//     if (!fileUrl) return;

//     // Extract publicId from URL
//     const parts = fileUrl.split("/");
//     const filename = parts.pop().split(".")[0];
//     const folder = parts.pop();
//     const publicId = `${folder}/${filename}`;

//     await cloudinary.uploader.destroy(publicId);

//     console.log("Old image deleted:", publicId);
//   } catch (err) {
//     console.log("Delete error:", err.message);
//   }
// };

// // ===================== uploadProductImage =====================
// exports.uploadProductImage = async (buffer, mimetype, product_id) => {
//   return uploadToFolder(buffer, `products/${product_id}`);
// };

// // ===================== uploadBufferToS3 =====================
// exports.uploadBufferToS3 = async (buffer, mimetype) => {
//   return uploadToFolder(buffer, "uploads");
// };

// // ===================== uploadBase64ToS3 =====================
// exports.uploadBase64ToS3 = async (base64String) => {
//   const res = await cloudinary.uploader.upload(base64String, {
//     folder: "uploads",
//     resource_type: "auto",
//   });

//   return res.secure_url;
// };

// // ===================== uploadMultipleBuffersToS3 =====================
// exports.uploadMultipleBuffersToS3 = async (files) => {
//   return Promise.all(
//     files.map((file) => uploadToFolder(file.buffer, "uploads"))
//   );
// };

// // ===================== uploadBufferAndReelsToS3 =====================
// exports.uploadBufferAndReelsToS3 = async (buffer, mimetype) => {
//   return uploadToFolder(buffer, "reels");
// };

// // ===================== uploadBufferAndBlogsToS3 =====================
// exports.uploadBufferAndBlogsToS3 = async (buffer, mimetype) => {
//   return uploadToFolder(buffer, "blogs");
// };

// // ===================== CORE uploader (stream) =====================
// async function uploadToFolder(buffer, folder) {
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader
//       .upload_stream(
//         {
//           folder,
//           resource_type: "auto",
//         },
//         (err, result) => {
//           if (err) return reject(err);

//           resolve(result.secure_url);
//         }
//       )
//       .end(buffer);
//   });
// }
const cloudinary = require("../config/cloudinary");
const { v4: uuid } = require("uuid");

// deleteFromS3 -> Cloudinary
exports.deleteFromS3 = async (fileUrl) => {
  try {
    if (!fileUrl) return;

    const parts = fileUrl.split("/");
    const filename = parts.pop().split(".")[0];
    const folder = parts.pop();
    const publicId = `${folder}/${filename}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.log("Delete error:", err.message);
  }
};

// uploadBufferToS3
exports.uploadBufferToS3 = async (buffer, mimetype) => {
  return uploadToCloudinary(buffer, "uploads");
};

// uploadProductImage
exports.uploadProductImage = async (buffer, mimetype, product_id) => {
  return uploadToCloudinary(buffer, `products/${product_id}`);
};

// uploadBufferAndReelsToS3
exports.uploadBufferAndReelsToS3 = async (buffer, mimetype) => {
  return uploadToCloudinary(buffer, "reels");
};

// uploadBufferAndBlogsToS3
exports.uploadBufferAndBlogsToS3 = async (buffer, mimetype) => {
  return uploadToCloudinary(buffer, "blogs");
};

// uploadMultipleBuffersToS3
exports.uploadMultipleBuffersToS3 = async (files) => {
  return Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer, "uploads"))
  );
};

// base64
exports.uploadBase64ToS3 = async (base64) => {
  const result = await cloudinary.uploader.upload(base64, {
    folder: "uploads",
    resource_type: "auto",
  });
  return result.secure_url;
};

// core
function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (err, result) => {
          if (err) return reject(err);
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}
