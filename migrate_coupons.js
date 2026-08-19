const { pool } = require("./config/dbConnection");

async function migrateCoupons() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log("Creating coupons table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type ENUM('percent', 'flat') NOT NULL,
        discount_value INT NOT NULL,
        min_order_value INT DEFAULT 0,
        max_discount INT DEFAULT NULL,
        usage_limit INT NOT NULL,
        used_count INT DEFAULT 0,
        expiry_date DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_expiry (expiry_date)
      )
    `);

    console.log("Checking for coupon_code in orders...");
    const [columns] = await connection.query(`SHOW COLUMNS FROM orders LIKE 'coupon_code'`);
    if (columns.length === 0) {
      console.log("Adding coupon_code to orders...");
      await connection.query(`ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) DEFAULT NULL`);
    }

    console.log("Checking for discount_amount in orders...");
    const [columns2] = await connection.query(`SHOW COLUMNS FROM orders LIKE 'discount_amount'`);
    if (columns2.length === 0) {
      console.log("Adding discount_amount to orders...");
      await connection.query(`ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0`);
    }

    console.log("Migration successful.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

migrateCoupons();
