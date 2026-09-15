/**
 * Migration: Add isPaymentPaid column to orders table
 * 
 * This adds an isPaymentPaid column (TINYINT, default 0) to the orders table,
 * and syncs existing paid orders from rajlaksmi_payment table.
 * 
 * Run: npm run db:migrate-isPaymentPaid
 */

require('dotenv').config();
const { pool } = require('./config/dbConnection');

async function run() {
  const connection = await pool.getConnection();
  try {
    // Step 1: Add isPaymentPaid column to orders table
    console.log("📦 Adding isPaymentPaid column to orders table...");
    try {
      await connection.query(
        `ALTER TABLE orders ADD COLUMN isPaymentPaid TINYINT(1) DEFAULT 0`
      );
      console.log("✅ Column 'isPaymentPaid' added successfully.");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("ℹ️ Column 'isPaymentPaid' already exists. Skipping...");
      } else {
        throw err;
      }
    }

    // Step 2: Sync existing paid orders from rajlaksmi_payment
    console.log("\n🔄 Syncing existing paid orders from rajlaksmi_payment...");
    try {
      const [result] = await connection.query(`
        UPDATE orders o
        INNER JOIN rajlaksmi_payment rp ON o.shopmozo_order_id = rp.shopmozo_order_id
        SET o.isPaymentPaid = 1
        WHERE (rp.isPaymentPaid = 1 OR rp.isPaymentPaid = '1' OR rp.isPaymentPaid = 'true')
          AND o.isPaymentPaid = 0
      `);
      console.log(`✅ Synced ${result.affectedRows} orders as paid.`);
    } catch (syncErr) {
      console.warn("⚠️ Sync failed (maybe no matching records):", syncErr.message);
    }

    // Step 3: Also sync orders where payment_status is 'completed'
    console.log("\n🔄 Syncing orders with payment_status = 'completed'...");
    try {
      const [result2] = await connection.query(`
        UPDATE orders SET isPaymentPaid = 1
        WHERE payment_status = 'completed' AND isPaymentPaid = 0
      `);
      console.log(`✅ Synced ${result2.affectedRows} additional orders as paid.`);
    } catch (syncErr2) {
      console.warn("⚠️ Sync by payment_status failed:", syncErr2.message);
    }

    // Step 4: Verify
    const [rows] = await connection.query('SHOW COLUMNS FROM orders');
    console.log("\n📋 Current orders table columns:", rows.map(r => r.Field));

    const [paidCount] = await connection.query(
      'SELECT COUNT(*) as count FROM orders WHERE isPaymentPaid = 1'
    );
    console.log(`\n✅ Total paid orders: ${paidCount[0].count}`);

    console.log("\n🎉 Migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
