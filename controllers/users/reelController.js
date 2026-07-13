// const {
//   addReel,
//   getAllReels,
//   getReelById,
//   deleteReel,
//   updateReelDB,
//   deleteAllReels,
// } = require("../../../model/users/reelModel");
// const {
//   uploadBufferAndReelsToS3,
//   deleteFromS3,
// } = require("../../service/uploadFile");

// // FIXED: Ensure video_url is valid URL
// exports.uploadReel = async (req, res) => {
//   try {
//     const { title, description } = req.body;

//     if (!req.files || !req.files.video) {
//       return res.status(400).json({ message: "Reel video is required" });
//     }

//     const videoFile = req.files.video[0];
//     const thumbFile = req.files.thumbnail?.[0];

//     const existingReels = await getAllReels();
//     for (const reel of existingReels) {
//       if (reel.video_url) await deleteFromS3(reel.video_url);
//       if (reel.thumb_url) await deleteFromS3(reel.thumb_url);
//     }
//     await deleteAllReels();

//     const videoUrl = await uploadBufferAndReelsToS3(
//       videoFile.buffer,
//       videoFile.mimetype
//     );
//     let thumbUrl = null;
//     if (thumbFile) {
//       thumbUrl = await uploadBufferAndReelsToS3(
//         thumbFile.buffer,
//         thumbFile.mimetype
//       );
//     }

//     const reelId = await addReel(
//       title || null,
//       description || null,
//       videoUrl,
//       thumbUrl
//     );

//     return res.json({
//       success: true,
//       message: "Reel uploaded successfully",
//       reel_id: reelId,
//       video_url: videoUrl,
//       thumb_url: thumbUrl,
//     });
//   } catch (err) {
//     console.error("Upload reel error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// // FIXED: Return proper response with id field
// exports.getAllReelsList = async (req, res) => {
//   try {
//     const reels = await getAllReels();

//     // Ensure each reel has required fields
//     const formattedReels = reels.map((reel) => ({
//       id: reel.id,
//       title: reel.title || "",
//       description: reel.description || "",
//       video_url: reel.video_url,
//       thumb_url: reel.thumb_url || null,
//       created_at: reel.created_at,
//     }));

//     return res.json({
//       success: true,
//       reels: formattedReels,
//       count: formattedReels.length,
//     });
//   } catch (err) {
//     console.error("Get all reels error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// exports.deleteReelById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const reel = await getReelById(id);

//     if (!reel) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Reel not found" });
//     }

//     if (reel.video_url) await deleteFromS3(reel.video_url);
//     if (reel.thumb_url) await deleteFromS3(reel.thumb_url);

//     await deleteReel(id);
//     return res.json({ success: true, message: "Reel deleted successfully" });
//   } catch (err) {
//     console.error("Delete reel error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// // FIXED: Properly handle multiple reels with id field
// // exports.uploadMultipleReels = async (req, res) => {
// //   try {
// //     const videoFiles = req.files?.reels || [];
// //     const thumbFiles = req.files?.thumbs || [];

// //     let { types, ids, titles, descriptions, order } = req.body;

// //     types = Array.isArray(types) ? types : [types];
// //     ids = Array.isArray(ids) ? ids : [ids];
// //     titles = Array.isArray(titles) ? titles : [titles];
// //     descriptions = Array.isArray(descriptions) ? descriptions : [descriptions];
// //     order = Array.isArray(order) ? order : [order];

// //     const existingReels = await getAllReels();

// //     let fileIndex = 0;
// //     const finalReels = [];

// //     for (let i = 0; i < types.length; i++) {
// //       const type = types[i];
// //       const reelId = ids[i];
// //       const title = titles[i] || "";
// //       const description = descriptions[i] || "";

// //       if (type === "file") {
// //         const file = videoFiles[fileIndex];
// //         if (!file) continue;

// //         const oldReel = existingReels.find((r) => r.id == reelId);

// //         const videoUrl = await uploadBufferAndReelsToS3(file.buffer, file.mimetype);

// //         let thumbUrl = null;
// //         if (thumbFiles[fileIndex]) {
// //           thumbUrl = await uploadBufferAndReelsToS3(
// //             thumbFiles[fileIndex].buffer,
// //             thumbFiles[fileIndex].mimetype
// //           );
// //         }

// //         let newId = reelId;

// //         if (!oldReel) {
// //           // INSERT NEW
// //           newId = await addReel(title, description, videoUrl, thumbUrl);
// //         } else {
// //           // DELETE OLD
// //           if (oldReel.video_url) await deleteFromS3(oldReel.video_url);
// //           if (oldReel.thumb_url) await deleteFromS3(oldReel.thumb_url);

// //           await updateReelDB(reelId, {
// //             title,
// //             description,
// //             videoUrl,
// //             thumbUrl,
// //           });
// //         }

// //         finalReels.push({
// //           id: newId,
// //           title,
// //           description,
// //           video_url: videoUrl,
// //           thumb_url: thumbUrl,
// //         });

// //         fileIndex++;
// //       }

// //       if (type === "server") {
// //         const oldReel = existingReels.find((r) => r.id == reelId);

// //         if (!oldReel) continue;

// //         await updateReelDB(reelId, {
// //           title,
// //           description,
// //           videoUrl: oldReel.video_url,
// //           thumbUrl: oldReel.thumb_url,
// //         });

// //         finalReels.push({
// //           id: reelId,
// //           title,
// //           description,
// //           video_url: oldReel.video_url,
// //           thumb_url: oldReel.thumb_url,
// //         });
// //       }
// //     }

// //     return res.json({
// //       success: true,
// //       message: "Reels updated successfully",
// //       reels: finalReels,
// //     });
// //   } catch (err) {
// //     console.error("Upload multiple reels error:", err);
// //     return res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// // FIXED: Properly handle multiple reels with id field (new + existing)
// exports.uploadMultipleReels = async (req, res) => {
//   try {
//     const videoFiles = req.files?.reels || [];
//     const thumbFiles = req.files?.thumbs || [];

//     let { types, ids, titles, descriptions, order } = req.body;

//     // normalize to arrays
//     types = Array.isArray(types) ? types : [types];
//     ids = Array.isArray(ids) ? ids : [ids];
//     titles = Array.isArray(titles) ? titles : [titles];
//     descriptions = Array.isArray(descriptions) ? descriptions : [descriptions];
//     order = Array.isArray(order) ? order : [order];

//     const existingReels = await getAllReels();

//     let fileIndex = 0;
//     const finalReels = [];

//     for (let i = 0; i < types.length; i++) {
//       const type = types[i];
//       const clientId = ids[i]; // frontend se aaya (existing id ya tempId)
//       const title = titles[i] || "";
//       const description = descriptions[i] || "";

//       if (type === "file") {
//         const file = videoFiles[fileIndex];
//         if (!file) {
//           fileIndex++;
//           continue;
//         }

//         // Agar clientId numeric hai to मान लो old reel hai, warna naya reel
//         const existing = existingReels.find(
//           (r) => r.id == clientId && !isNaN(Number(clientId))
//         );

//         // ---- Video upload ----
//         const videoUrl = await uploadBufferAndReelsToS3(
//           file.buffer,
//           file.mimetype
//         );

//         // ---- Thumbnail upload (optional) ----
//         let thumbUrl = existing?.thumb_url || null;
//         if (thumbFiles[fileIndex]) {
//           if (existing?.thumb_url) {
//             await deleteFromS3(existing.thumb_url);
//           }

//           thumbUrl = await uploadBufferAndReelsToS3(
//             thumbFiles[fileIndex].buffer,
//             thumbFiles[fileIndex].mimetype
//           );
//         }

//         let savedId;

//         if (existing) {
//           // UPDATE old reel
//           await updateReelDB(existing.id, {
//             title,
//             description,
//             videoUrl,
//             thumbUrl,
//           });
//           savedId = existing.id;
//         } else {
//           // INSERT new reel 🚀
//           savedId = await addReel(title, description, videoUrl, thumbUrl);
//         }

//         finalReels.push({
//           id: savedId,
//           title,
//           description,
//           video_url: videoUrl,
//           thumb_url: thumbUrl,
//         });

//         fileIndex++;
//       }

//       if (type === "server") {
//         // Pure server-side reel (sirf title/description update, file same)
//         const oldReel = existingReels.find((r) => r.id == clientId);
//         if (!oldReel) continue;

//         await updateReelDB(oldReel.id, {
//           title,
//           description,
//           videoUrl: oldReel.video_url,
//           thumbUrl: oldReel.thumb_url,
//         });

//         finalReels.push({
//           id: oldReel.id,
//           title,
//           description,
//           video_url: oldReel.video_url,
//           thumb_url: oldReel.thumb_url,
//         });
//       }
//     }

//     return res.json({
//       success: true,
//       message: "Reels updated successfully",
//       reels: finalReels,
//     });
//   } catch (err) {
//     console.error("Upload multiple reels error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// /**
//  * // FIXED: Properly handle multiple reels with id field (new + existing)
// exports.uploadMultipleReels = async (req, res) => {
//   try {
//     const videoFiles = req.files?.reels || [];
//     const thumbFiles = req.files?.thumbs || [];

//     let { types, ids, titles, descriptions, order } = req.body;

//     // normalize to arrays
//     types = Array.isArray(types) ? types : [types];
//     ids = Array.isArray(ids) ? ids : [ids];
//     titles = Array.isArray(titles) ? titles : [titles];
//     descriptions = Array.isArray(descriptions)
//       ? descriptions
//       : [descriptions];
//     order = Array.isArray(order) ? order : [order];

//     const existingReels = await getAllReels();

//     let fileIndex = 0;
//     const finalReels = [];

//     for (let i = 0; i < types.length; i++) {
//       const type = types[i];
//       const clientId = ids[i]; // frontend se aaya (existing id ya tempId)
//       const title = titles[i] || "";
//       const description = descriptions[i] || "";

//       if (type === "file") {
//         const file = videoFiles[fileIndex];
//         if (!file) {
//           fileIndex++;
//           continue;
//         }

//         // Agar clientId numeric hai to मान लो old reel hai, warna naya reel
//         const existing = existingReels.find(
//           (r) => r.id == clientId && !isNaN(Number(clientId))
//         );

//         // ---- Video upload ----
//         const videoUrl = await uploadBufferAndReelsToS3(file.buffer, file.mimetype);

//         // ---- Thumbnail upload (optional) ----
//         let thumbUrl = existing?.thumb_url || null;
//         if (thumbFiles[fileIndex]) {
//           if (existing?.thumb_url) {
//             await deleteFromS3(existing.thumb_url);
//           }

//           thumbUrl = await uploadBufferAndReelsToS3(
//             thumbFiles[fileIndex].buffer,
//             thumbFiles[fileIndex].mimetype
//           );
//         }

//         let savedId;

//         if (existing) {
//           // UPDATE old reel
//           await updateReelDB(existing.id, {
//             title,
//             description,
//             videoUrl,
//             thumbUrl,
//           });
//           savedId = existing.id;
//         } else {
//           // INSERT new reel 🚀
//           savedId = await addReel(title, description, videoUrl, thumbUrl);
//         }

//         finalReels.push({
//           id: savedId,
//           title,
//           description,
//           video_url: videoUrl,
//           thumb_url: thumbUrl,
//         });

//         fileIndex++;
//       }

//       if (type === "server") {
//         // Pure server-side reel (sirf title/description update, file same)
//         const oldReel = existingReels.find((r) => r.id == clientId);
//         if (!oldReel) continue;

//         await updateReelDB(oldReel.id, {
//           title,
//           description,
//           videoUrl: oldReel.video_url,
//           thumbUrl: oldReel.thumb_url,
//         });

//         finalReels.push({
//           id: oldReel.id,
//           title,
//           description,
//           video_url: oldReel.video_url,
//           thumb_url: oldReel.thumb_url,
//         });
//       }
//     }

//     return res.json({
//       success: true,
//       message: "Reels updated successfully",
//       reels: finalReels,
//     });
//   } catch (err) {
//     console.error("Upload multiple reels error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

//  *
//  * */

// exports.updateReel = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, description } = req.body;

//     const reel = await getReelById(id);
//     if (!reel) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Reel not found" });
//     }

//     let videoUrl = reel.video_url;
//     let thumbUrl = reel.thumb_url;

//     if (req.files?.video?.[0]) {
//       if (reel.video_url) await deleteFromS3(reel.video_url);
//       const video = req.files.video[0];
//       videoUrl = await uploadBufferAndReelsToS3(video.buffer, video.mimetype);
//     }

//     if (req.files?.thumbnail?.[0]) {
//       if (reel.thumb_url) await deleteFromS3(reel.thumb_url);
//       const thumb = req.files.thumbnail[0];
//       thumbUrl = await uploadBufferAndReelsToS3(thumb.buffer, thumb.mimetype);
//     }

//     await updateReelDB(id, {
//       title: title !== undefined ? title : reel.title,
//       description: description !== undefined ? description : reel.description,
//       videoUrl,
//       thumbUrl,
//     });

//     return res.json({
//       success: true,
//       message: "Reel updated successfully",
//       data: {
//         id,
//         title: title !== undefined ? title : reel.title,
//         description: description !== undefined ? description : reel.description,
//         video_url: videoUrl,
//         thumb_url: thumbUrl,
//       },
//     });
//   } catch (err) {
//     console.error("Update reel error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

const {
  addReel,
  getAllReels,
  getReelById,
  deleteReel,
} = require("../../model/users/reelModel");

exports.createReel = async (req, res) => {
  try {
    const { reel_id } = req.body;

    if (!reel_id) {
      return res.json({ success: false, message: "Reel ID required" });
    }

    const id = await addReel(reel_id);

    res.json({ success: true, id });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listReels = async (req, res) => {
  const reels = await getAllReels();
  res.json({ success: true, reels });
};

exports.deleteReelById = async (req, res) => {
  const { id } = req.params;
  await deleteReel(id);
  res.json({ success: true });
};
