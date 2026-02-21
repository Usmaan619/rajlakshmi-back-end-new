const { withConnection } = require("../../utils/helper");

// CREATE CATEGORY
exports.addCategory = async (data) => {
  return await withConnection(async (conn) => {
    const query = `
      INSERT INTO rajlaksmi_category
      (
        category_name,
        category_slug,
        category_description,
        category_image,
        is_featured,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.category_name,
      data.category_slug,
      data.category_description,
      data.category_image,
      data.is_featured || 0,
      data.is_active || 1,
    ];

    const [res] = await conn.execute(query, values);
    return res.insertId;
  });
};

// GET ALL
exports.getAllCategory = async () => {
  return await withConnection(async (conn) => {
    const [rows] = await conn.execute(`
      SELECT * FROM rajlaksmi_category
      ORDER BY id DESC
    `);

    return rows;
  });
};

// GET BY ID
exports.getCategoryById = async (id) => {
  return await withConnection(async (conn) => {
    const [rows] = await conn.execute(
      `SELECT * FROM rajlaksmi_category WHERE id=?`,
      [id],
    );

    return rows.length ? rows[0] : null;
  });
};

// UPDATE
exports.updateCategory = async (id, data) => {
  return await withConnection(async (conn) => {
    const query = `
      UPDATE rajlaksmi_category
      SET
        category_name=?,
        category_slug=?,
        category_description=?,
        category_image=?,
        is_featured=?,
        is_active=?
      WHERE id=?
    `;

    const values = [
      data.category_name,
      data.category_slug,
      data.category_description,
      data.category_image,
      data.is_featured,
      data.is_active,
      id,
    ];

    const [res] = await conn.execute(query, values);
    return res.affectedRows > 0;
  });
};

// DELETE
exports.deleteCategory = async (id) => {
  return await withConnection(async (conn) => {
    const [res] = await conn.execute(
      `DELETE FROM rajlaksmi_category WHERE id=?`,
      [id],
    );

    return res.affectedRows > 0;
  });
};
