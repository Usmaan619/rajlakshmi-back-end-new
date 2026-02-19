const { withConnection } = require("../../utils/helper");

// exports.addReel = async (title, description, videoUrl, thumbUrl) => {
//   return await withConnection(async (connection) => {
//     const query = `
//       INSERT INTO gauswarn_reels (title, description, video_url, thumb_url)
//       VALUES (?, ?, ?, ?)
//     `;
//     const [result] = await connection.execute(query, [
//       title,
//       description,
//       videoUrl,
//       thumbUrl,
//     ]);

//     return result.insertId;
//   });
// };

// exports.getAllReels = async () => {
//   return await withConnection(async (connection) => {
//     const query = "SELECT * FROM gauswarn_reels ORDER BY id DESC";
//     const [rows] = await connection.execute(query);
//     return rows;
//   });
// };

// exports.getReelById = async (id) => {
//   return await withConnection(async (connection) => {
//     const query = "SELECT * FROM gauswarn_reels WHERE id = ?";
//     const [rows] = await connection.execute(query, [id]);
//     return rows[0] || null;
//   });
// };

// exports.deleteReel = async (id) => {
//   return await withConnection(async (connection) => {
//     const query = "DELETE FROM gauswarn_reels WHERE id = ?";
//     await connection.execute(query, [id]);
//     return true;
//   });
// };

// exports.deleteAllReels = async () => {
//   return await withConnection(async (connection) => {
//     const query = "DELETE FROM gauswarn_reels";
//     await connection.execute(query);
//     return true;
//   });
// };

// exports.updateReelDB = async (id, data) => {
//   return await withConnection(async (connection) => {
//     const query = `
//       UPDATE gauswarn_reels
//       SET title = ?, description = ?, video_url = ?, thumb_url = ?
//       WHERE id = ?
//     `;
//     await connection.execute(query, [
//       data.title,
//       data.description,
//       data.videoUrl,
//       data.thumbUrl,
//       id,
//     ]);
//     return true;
//   });
// };

exports.addReel = async (reelId) => {
  return await withConnection(async (connection) => {
    const query = `
      INSERT INTO gauswarn_reels_instagram (reel_id)
      VALUES (?)
    `;
    const [result] = await connection.execute(query, [reelId]);
    return result.insertId;
  });
};

exports.getAllReels = async () => {
  return withConnection(async (connection) => {
    const query = "SELECT * FROM gauswarn_reels_instagram ORDER BY id DESC";
    const [rows] = await connection.execute(query);
    return rows;
  });
};

exports.getReelById = async (id) => {
  return withConnection(async (connection) => {
    const query = "SELECT * FROM gauswarn_reels_instagram WHERE id = ?";
    const [rows] = await connection.execute(query, [id]);
    return rows[0] || null;
  });
};

exports.deleteReel = async (id) => {
  return withConnection(async (connection) => {
    await connection.execute(
      "DELETE FROM gauswarn_reels_instagram WHERE id = ?",
      [id]
    );
    return true;
  });
};
