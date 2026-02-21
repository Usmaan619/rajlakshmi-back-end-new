const { withConnection } = require("../../utils/helper");

/**
 * Safely parse a JSON column value coming from MySQL.
 * Some rows may have been saved as a plain string (e.g. "100ml") instead
 * of a proper JSON array (e.g. '["100ml"]'). JSON.parse crashes on those.
 * This helper returns the parsed value, or wraps the raw string in an array,
 * or returns the fallback (default []) when the value is falsy.
 */
const safeJsonParse = (value, fallback = []) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return [value]; // plain string → wrap so callers always get an array
  }
};

exports.addProduct = async (data) => {
  try {
    return await withConnection(async (connection) => {
      const query = `
        INSERT INTO rajlaksmi_product
        (
          product_name,
          product_price,
          product_weight,
          product_purchase_price,
          product_del_price,
          is_featured,
          is_active,
          product_stock,
          product_images,
          category_name
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        data.product_name,
        data.product_price,
        JSON.stringify(data.product_weight),
        data.product_purchase_price,
        data.product_del_price,
        data.is_featured || 0,
        data.is_active || 1,
        data.product_stock || 0,
        JSON.stringify(data.product_images),
        data.category_name,
      ];

      const [result] = await connection.execute(query, values);

      return result.insertId;
    });
  } catch (err) {
    throw new Error(err.message);
  }
};

// Get All Products
exports.getAllProducts = async () => {
  return await withConnection(async (connection) => {
    const query = `SELECT * FROM rajlaksmi_product ORDER BY id DESC`;

    const [rows] = await connection.execute(query);

    return rows.map((product) => ({
      ...product,
      product_images: safeJsonParse(product.product_images),
      product_weight: safeJsonParse(product.product_weight),
    }));
  });
};

// Get Single Product by ID
exports.getProductById = async (id) => {
  return await withConnection(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT * FROM rajlaksmi_product WHERE id=?`,
      [id],
    );

    if (!rows.length) return null;

    const product = rows[0];

    product.product_images = safeJsonParse(product.product_images);
    product.product_weight = safeJsonParse(product.product_weight);

    return product;
  });
};

// Update Product
exports.updateProduct = async (id, data) => {
  return await withConnection(async (connection) => {
    const query = `
      UPDATE rajlaksmi_product
      SET
        product_name = ?,
        product_price = ?,
        product_weight = ?,
        product_purchase_price = ?,
        product_del_price = ?,
        is_featured = ?,
        is_active = ?,
        product_stock = ?,
        product_images = ?,
        category_name = ?
      WHERE id = ?
    `;

    const values = [
      data.product_name,
      data.product_price,
      JSON.stringify(data.product_weight),
      data.product_purchase_price,
      data.product_del_price,
      data.is_featured,
      data.is_active,
      data.product_stock,
      JSON.stringify(data.product_images),
      data.category_name,
      id,
    ];

    const [res] = await connection.execute(query, values);

    return res.affectedRows > 0;
  });
};

exports.deleteProduct = async (id) => {
  return await withConnection(async (connection) => {
    const [res] = await connection.execute(
      `DELETE FROM rajlaksmi_product WHERE id=?`,
      [id],
    );

    return res.affectedRows > 0;
  });
};

exports.updateProductImages = async (product_id, images) => {
  return await withConnection(async (conn) => {
    const query = `
      UPDATE rajlaksmi_product 
      SET product_images = ?
      WHERE product_id = ?
    `;

    const [res] = await conn.execute(query, [images, product_id]);
    return res.affectedRows > 0;
  });
};

// home page products
exports.getHomePageProducts = async () => {
  return await withConnection(async (connection) => {
    const query = `
      SELECT * FROM (
        SELECT *,
        ROW_NUMBER() OVER (PARTITION BY category_name ORDER BY id DESC) as rn
        FROM rajlaksmi_product
        WHERE is_active = 1
      ) as t
      WHERE rn = 1
      LIMIT 5
    `;

    const [rows] = await connection.execute(query);

    return rows.map((product) => ({
      ...product,
      product_images: safeJsonParse(product.product_images),
      product_weight: safeJsonParse(product.product_weight),
    }));
  });
};

exports.getProductsByCategory = async (category_name) => {
  return await withConnection(async (connection) => {
    const query = `
      SELECT * FROM rajlaksmi_product
      WHERE category_name = ?
      AND is_active = 1
      ORDER BY id DESC
    `;

    const [rows] = await connection.execute(query, [category_name]);

    return rows.map((product) => ({
      ...product,
      product_images: safeJsonParse(product.product_images),
      product_weight: safeJsonParse(product.product_weight),
    }));
  });
};
