const { withConnection } = require("../../utils/helper");

/* ================================
CREATE BLOG
================================ */
exports.createBlog = async (data) => {
  return withConnection(async (connection) => {
    const query = `
      INSERT INTO gauswarn_blogs (title, slug, content, category, image_url)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(query, [
      data.title,
      data.slug,
      data.content,
      data.category,
      data.image_url,
    ]);
    return result.insertId;
  });
};

/* ================================
GET ALL BLOGS (FIXED FOR EC2)
================================ */
exports.getAllBlogs = async (page = 1, limit = 10, sortOrder = "DESC") => {
  return withConnection(async (connection) => {
    // ✅ Force integers and validate
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // max 100 for safety
    const offset = (pageNum - 1) * limitNum;
    
    // ✅ Direct interpolation (safe after validation) - fixes mysql2 LIMIT bug
    const query = `
      SELECT *
      FROM gauswarn_blogs
      ORDER BY created_at ${sortOrder === "ASC" ? "ASC" : "DESC"}
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    
    const [rows] = await connection.execute(query); // No params needed
    return rows;
  });
};

/* ================================
GET TOTAL BLOG COUNT
================================ */
exports.getBlogCount = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT COUNT(*) AS total FROM gauswarn_blogs"
    );
    return rows[0].total;
  });
};

/* ================================
GET BLOG BY ID
================================ */
exports.getBlogById = async (id) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT * FROM gauswarn_blogs WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  });
};

/* ================================
GET BLOG BY SLUG
================================ */
exports.getBlogBySlug = async (slug) => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT * FROM gauswarn_blogs WHERE slug = ?",
      [slug]
    );
    return rows[0] || null;
  });
};

/* ================================
UPDATE BLOG
================================ */
exports.updateBlog = async (id, data) => {
  return withConnection(async (connection) => {
    const query = `
      UPDATE gauswarn_blogs
      SET title = ?, slug = ?, content = ?, category = ?, image_url = ?
      WHERE id = ?
    `;
    await connection.execute(query, [
      data.title,
      data.slug,
      data.content,
      data.category,
      data.image_url,
      id,
    ]);
    return true;
  });
};

/* ================================
DELETE BLOG
================================ */
exports.deleteBlog = async (id) => {
  return withConnection(async (connection) => {
    await connection.execute(
      "DELETE FROM gauswarn_blogs WHERE id = ?",
      [id]
    );
    return true;
  });
};
