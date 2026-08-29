/**
 * Migration: Add gst_percent column to rajlaksmi_cart table
 * Safe to run multiple times — checks before altering.
 *
 * Run: node scripts/add_cart_gst_field.js
 */

const mysql = require("mysql2/promise");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log("\n=== GST Migration for rajlaksmi_cart ===\n");

    // ── 1. rajlaksmi_cart: add gst_percent if missing ──────────────
    const [cartCols] = await connection.execute("DESCRIBE rajlaksmi_cart");
    const cartHasGst = cartCols.some((r) => r.Field === "gst_percent");

    if (!cartHasGst) {
      console.log("Adding gst_percent to rajlaksmi_cart ...");
      await connection.execute(
        `ALTER TABLE rajlaksmi_cart
         ADD COLUMN gst_percent DECIMAL(5,2) NOT NULL DEFAULT 0
         AFTER weight`
      );
      console.log("gst_percent added to rajlaksmi_cart.");
    } else {
      console.log("rajlaksmi_cart.gst_percent already exists — skipped.");
    }

    // ── 2. rajlaksmi_product: add gst_percent if missing ───────────
    const [prodCols] = await connection.execute("DESCRIBE rajlaksmi_product");
    const prodHasGst = prodCols.some((r) => r.Field === "gst_percent");

    if (!prodHasGst) {
      console.log("Adding gst_percent to rajlaksmi_product ...");
      await connection.execute(
        `ALTER TABLE rajlaksmi_product
         ADD COLUMN gst_percent DECIMAL(5,2) NOT NULL DEFAULT 0`
      );
      console.log("gst_percent added to rajlaksmi_product.");
    } else {
      console.log("rajlaksmi_product.gst_percent already exists — skipped.");
    }

    // ── 3. Patch existing cart rows: set gst_percent from product table ─
    console.log("\nSyncing gst_percent for existing cart items from product table ...");
    const [updateResult] = await connection.execute(
      `UPDATE rajlaksmi_cart c
       JOIN rajlaksmi_product p ON c.product_id = p.id
       SET c.gst_percent = COALESCE(p.gst_percent, 0)
       WHERE c.gst_percent = 0 OR c.gst_percent IS NULL`
    );
    console.log(`Updated ${updateResult.affectedRows} existing cart row(s) with correct GST.`);

    console.log("\n=== Migration complete! ===\n");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
