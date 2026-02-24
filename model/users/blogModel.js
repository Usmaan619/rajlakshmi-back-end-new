const { withConnection } = require("../../utils/helper");

/* ================================
CREATE BLOG
================================ */
exports.createBlog = async (data) => {
  return withConnection(async (connection) => {
    const query = `
      INSERT INTO rajlaksmi_blogs (title, slug, content, category, image_url, description, author, read_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(query, [
      data.title,
      data.slug,
      data.content,
      data.category,
      data.image_url,
      data.description,
      data.author,
      data.read_time,
    ]);
    return result.insertId;
  });
};

/* ================================
GET ALL BLOGS (FIXED FOR EC2)
================================ */
exports.getAllBlogs = async (page = 1, limit = 10, sortOrder = "DESC") => {
  return withConnection(async (connection) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;

    const query = `
      SELECT *
      FROM rajlaksmi_blogs
      ORDER BY created_at ${sortOrder === "ASC" ? "ASC" : "DESC"}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const [rows] = await connection.execute(query);
    return rows;
  });
};

/* ================================
GET RELATED BLOGS
================================ */
exports.getRelatedBlogs = async (category, currentId, limit = 5) => {
  return withConnection(async (connection) => {
    const query = `
      SELECT id, title, slug, category, description, author, created_at as date, image_url as image
      FROM rajlaksmi_blogs
      WHERE category = ? AND id != ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const [rows] = await connection.execute(query, [
      category,
      currentId,
      parseInt(limit),
    ]);
    return rows;
  });
};

/* ================================
GET TOTAL BLOG COUNT
================================ */
exports.getBlogCount = async () => {
  return withConnection(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT COUNT(*) AS total FROM rajlaksmi_blogs",
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
      "SELECT * FROM rajlaksmi_blogs WHERE id = ?",
      [id],
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
      "SELECT * FROM rajlaksmi_blogs WHERE slug = ?",
      [slug],
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
      UPDATE rajlaksmi_blogs
      SET title = ?, slug = ?, content = ?, category = ?, image_url = ?, description = ?, author = ?, read_time = ?
      WHERE id = ?
    `;
    await connection.execute(query, [
      data.title,
      data.slug,
      data.content,
      data.category,
      data.image_url,
      data.description,
      data.author,
      data.read_time,
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
    await connection.execute("DELETE FROM rajlaksmi_blogs WHERE id = ?", [id]);
    return true;
  });
};
