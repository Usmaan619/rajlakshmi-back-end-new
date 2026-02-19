const { withConnection } = require("../../utils/helper");

exports.getAll = async ({ page, limit, search, status }) => {
  return await withConnection(async (connection) => {

    // 🔒 Force numbers
    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) limit = 10;

    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const values = [];

    if (search && search.trim()) {
      where += " AND email LIKE ?";
      values.push(`%${search}%`);
    }

    if (status && status.trim()) {
      where += " AND status = ?";
      values.push(status);
    }

    // ❌ NO ? FOR LIMIT / OFFSET
    const sql = `
      SELECT *
      FROM rajlaksmi_newsletter_subscribers
      ${where}
      ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countSql = `
      SELECT COUNT(*) AS total
      FROM rajlaksmi_newsletter_subscribers
      ${where}
    `;

    const [rows] = await connection.execute(sql, values);
    const [[{ total }]] = await connection.execute(countSql, values);

    return {
      rows,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
};


exports.create = async (email) => {
  return await withConnection(async (connection) => {
    const [res] = await connection.execute(
      `INSERT INTO rajlaksmi_newsletter_subscribers (email) VALUES (?)`,
      [email]
    );
    return res.insertId;
  });
};

exports.updateStatus = async (id, status) => {
  return await withConnection(async (connection) => {
    await connection.execute(
      `UPDATE rajlaksmi_newsletter_subscribers SET status=? WHERE id=?`,
      [status, id]
    );
    return true;
  });
};

exports.delete = async (id) => {
  return await withConnection(async (connection) => {
    await connection.execute(`DELETE FROM rajlaksmi_newsletter_subscribers WHERE id=?`, [
      id,
    ]);
    return true;
  });
};
