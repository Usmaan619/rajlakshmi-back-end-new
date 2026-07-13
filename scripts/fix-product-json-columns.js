/**
 * One-time migration: fix plain-string values in product_weight and product_images.
 *
 * Some rows were inserted with a raw string (e.g. "100ml") instead of a JSON
 * array ('[\"100ml\"]').  This script detects those rows, wraps the value in an
 * array, and re-saves it as valid JSON so that JSON.parse never crashes again.
 *
 * Usage:
 *   node scripts/fix-product-json-columns.js
 */

const dotenv = require("dotenv");
dotenv.config();

const { connectToDatabase } = require("../config/dbConnection");

const isValidJson = (str) => {
  if (!str) return true; // NULL / empty is fine, no fix needed
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

(async () => {
  const conn = await connectToDatabase();

  try {
    const [rows] = await conn.execute(
      "SELECT id, product_weight, product_images FROM rajlaksmi_product",
    );

    console.log(`Checking ${rows.length} rows…`);
    let fixed = 0;

    for (const row of rows) {
      const updates = {};

      if (!isValidJson(row.product_weight)) {
        console.log(
          `  Row ${row.id}: product_weight is plain string → "${row.product_weight}"`,
        );
        updates.product_weight = JSON.stringify([row.product_weight]);
      }

      if (!isValidJson(row.product_images)) {
        console.log(
          `  Row ${row.id}: product_images is plain string → "${row.product_images}"`,
        );
        updates.product_images = JSON.stringify([row.product_images]);
      }

      if (Object.keys(updates).length > 0) {
        const setClauses = Object.keys(updates)
          .map((k) => `${k} = ?`)
          .join(", ");
        const values = [...Object.values(updates), row.id];
        await conn.execute(
          `UPDATE rajlaksmi_product SET ${setClauses} WHERE id = ?`,
          values,
        );
        fixed++;
      }
    }

    console.log(`\nDone. Fixed ${fixed} row(s).`);
  } finally {
    await conn.end();
  }
})();
