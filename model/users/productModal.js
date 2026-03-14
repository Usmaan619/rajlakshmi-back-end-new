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
    return [value];
  }
};

const mapProduct = (product) => {
  const images = safeJsonParse(product.product_images);
  const weight = safeJsonParse(product.product_weight);

  // Calculate discount if possible
  let discount = product.discount || 0;
  if (!discount && product.product_price && product.product_del_price) {
    const diff = product.product_del_price - product.product_price;
    if (diff > 0) {
      discount = Math.round((diff / product.product_del_price) * 100);
    }
  }

  return {
    ...product,
    product_images: images,
    product_weight: weight,
    discount,
  };
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
          category_name,
          category_id,
          short_description,
          full_description,
          health_benefits,
          ingredients,
          product_subtitle
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        data.product_name ?? null,
        data.product_price ?? null,
        typeof data.product_weight === "string"
          ? data.product_weight
          : JSON.stringify(data.product_weight ?? []),
        data.product_purchase_price ?? null,
        data.product_del_price ?? null,
        data.is_featured ?? 0,
        data.is_active ?? 1,
        data.product_stock ?? 0,
        JSON.stringify(data.product_images ?? []),
        data.category_name ?? null,
        data.category_id ?? null,
        data.short_description ?? null,
        data.full_description ?? null,
        data.health_benefits ?? null,
        data.ingredients ?? null,
        data.product_subtitle ?? null,
      ];

      // Catch any remaining undefined before MySQL2 does
      const undefinedField = values.findIndex((v) => v === undefined);
      if (undefinedField !== -1) {
        throw new Error(
          `addProduct: value at index ${undefinedField} is undefined`,
        );
      }

      const [result] = await connection.execute(query, values);

      return result.insertId;
    });
  } catch (err) {
    throw new Error(err.message);
  }
};

// Get All Products
exports.getAllProducts = async (filters = {}) => {
  return await withConnection(async (connection) => {
    let whereClause = `WHERE 1=1`;
    const values = [];

    if (filters.category && filters.category !== "all") {
      whereClause += ` AND category_name = ?`;
      values.push(filters.category);
    }

    if (filters.search) {
      whereClause += ` AND product_name LIKE ?`;
      values.push(`%${filters.search}%`);
    }

    if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
      whereClause += ` AND product_price >= ?`;
      values.push(Number(filters.minPrice));
    }

    if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
      whereClause += ` AND product_price <= ?`;
      values.push(Number(filters.maxPrice));
    }

    if (filters.weight && filters.weight !== "all") {
      whereClause += ` AND product_weight LIKE ?`;
      values.push(`%${filters.weight}%`);
    }

    const countQuery = `SELECT COUNT(*) as total FROM rajlaksmi_product ${whereClause}`;
    const [countRows] = await connection.execute(countQuery, values);
    const total = countRows[0].total;

    let query = `SELECT * FROM rajlaksmi_product ${whereClause} ORDER BY id ASC`;

    const limitNum = parseInt(filters.limit) || 10;
    const pageNum = parseInt(filters.page) || 1;
    const offset = (pageNum - 1) * limitNum;

    query += ` LIMIT ${limitNum} OFFSET ${offset}`;

    const [rows] = await connection.execute(query, values);

    return {
      products: rows.map(mapProduct),
      total,
    };
  });
};

// Get Single Product by ID
exports.getProductById = async (id) => {
  if (id === undefined || id === null) {
    throw new Error("getProductById: id must not be undefined or null");
  }
  return await withConnection(async (connection) => {
    const [rows] = await connection.execute(
      `SELECT * FROM rajlaksmi_product WHERE id=?`,
      [id],
    );

    if (!rows.length) return null;

    const product = rows[0];

    return mapProduct(product);
  });
};

// Update Product (does NOT touch product_images — use updateProductImages() for that)
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
        category_name = ?,
        category_id = ?,
        short_description = ?,
        full_description = ?,
        health_benefits = ?,
        ingredients = ?,
        product_subtitle = ?
      WHERE id = ?
    `;

    const values = [
      data.product_name ?? null,
      data.product_price ?? null,
      typeof data.product_weight === "string"
        ? data.product_weight
        : JSON.stringify(data.product_weight ?? []),
      data.product_purchase_price ?? null,
      data.product_del_price ?? null,
      data.is_featured ?? null,
      data.is_active ?? null,
      data.product_stock ?? null,
      data.category_name ?? null,
      data.category_id ?? null,
      data.short_description ?? null,
      data.full_description ?? null,
      data.health_benefits ?? null,
      data.ingredients ?? null,
      data.product_subtitle ?? null,
      id,
    ];

    // Catch any remaining undefined before MySQL2 does
    const undefinedField = values.findIndex((v) => v === undefined);
    if (undefinedField !== -1) {
      throw new Error(
        `updateProduct: value at index ${undefinedField} is undefined`,
      );
    }

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

exports.updateProductImages = async (id, images) => {
  return await withConnection(async (conn) => {
    const query = `
      UPDATE rajlaksmi_product 
      SET product_images = ?
      WHERE id = ?
    `;

    const [res] = await conn.execute(query, [images, id]);
    return res.affectedRows > 0;
  });
};

// home page products
exports.getHomePageProducts = async () => {
  return await withConnection(async (connection) => {
    const query = `
      SELECT * FROM (
        SELECT *,
        ROW_NUMBER() OVER (PARTITION BY category_name ORDER BY id ASC) as rn
        FROM rajlaksmi_product
        WHERE is_active = 1
      ) as t
      WHERE rn = 1
      LIMIT 5
    `;

    const [rows] = await connection.execute(query);

    return rows.map(mapProduct);
  });
};

exports.getProductsByCategory = async (category_name) => {
  return await withConnection(async (connection) => {
    const query = `
      SELECT * FROM rajlaksmi_product
      WHERE category_name = ?
      AND is_active = 1
      ORDER BY id ASC
    `;

    const [rows] = await connection.execute(query, [category_name]);

    return rows.map(mapProduct);
  });
};
