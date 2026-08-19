const { withConnection } = require("../../utils/helper");

exports.findCouponByCode = async (code) => {
  return await withConnection(async (connection) => {
    const query = `SELECT * FROM coupons WHERE code = ? AND is_active = TRUE LIMIT 1`;
    const [rows] = await connection.execute(query, [code.toUpperCase()]);
    return rows[0] || null;
  });
};

exports.incrementUsedCount = async (id) => {
  return await withConnection(async (connection) => {
    const query = `UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`;
    const [result] = await connection.execute(query, [id]);
    return result;
  });
};

exports.getAllCoupons = async () => {
  return await withConnection(async (connection) => {
    const query = `SELECT * FROM coupons ORDER BY created_at DESC`;
    const [rows] = await connection.execute(query);
    return rows;
  });
};

exports.createCoupon = async (data) => {
  const {
    code,
    discount_type,
    discount_value,
    min_order_value,
    max_discount,
    usage_limit,
    expiry_date,
  } = data;
  return await withConnection(async (connection) => {
    const query = `
      INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await connection.execute(query, [
      code.toUpperCase(),
      discount_type,
      discount_value || 0,
      min_order_value === "" ? 0 : (min_order_value || 0),
      max_discount === "" ? null : (max_discount || null),
      usage_limit || 0,
      expiry_date,
    ]);
    return result;
  });
};

exports.updateCoupon = async (id, data) => {
  const {
    code,
    discount_type,
    discount_value,
    min_order_value,
    max_discount,
    usage_limit,
    expiry_date,
    is_active,
  } = data;
  return await withConnection(async (connection) => {
    const fields = [];
    const values = [];

    if (code !== undefined) {
      fields.push("code = ?");
      values.push(code.toUpperCase());
    }
    if (discount_type !== undefined) {
      fields.push("discount_type = ?");
      values.push(discount_type);
    }
    if (discount_value !== undefined) {
      fields.push("discount_value = ?");
      values.push(discount_value === "" ? 0 : discount_value);
    }
    if (min_order_value !== undefined) {
      fields.push("min_order_value = ?");
      values.push(min_order_value === "" ? 0 : min_order_value);
    }
    if (max_discount !== undefined) {
      fields.push("max_discount = ?");
      values.push(max_discount === "" ? null : max_discount);
    }
    if (usage_limit !== undefined) {
      fields.push("usage_limit = ?");
      values.push(usage_limit === "" ? 0 : usage_limit);
    }
    if (expiry_date !== undefined) {
      fields.push("expiry_date = ?");
      values.push(expiry_date);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(is_active);
    }

    if (fields.length === 0) return null;

    const query = `UPDATE coupons SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);
    const [result] = await connection.execute(query, values);
    return result;
  });
};

exports.deleteCoupon = async (id) => {
  return await withConnection(async (connection) => {
    const query = `DELETE FROM coupons WHERE id = ?`;
    const [result] = await connection.execute(query, [id]);
    return result;
  });
};
