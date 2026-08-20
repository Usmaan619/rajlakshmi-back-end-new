const { pool } = require('./config/dbConnection');

async function run() {
  try {
    const alterQuery = `
      ALTER TABLE rajlaksmi_payment 
      ADD COLUMN shipping_charge decimal(10,2) DEFAULT '0.00', 
      ADD COLUMN gst_amount decimal(10,2) DEFAULT '0.00', 
      ADD COLUMN platform_fee decimal(10,2) DEFAULT '0.00', 
      ADD COLUMN discount_amount decimal(10,2) DEFAULT '0.00', 
      ADD COLUMN coupon_code varchar(100) DEFAULT NULL;
    `;
    console.log("Adding new columns to rajlaksmi_payment table...");
    await pool.query(alterQuery);
    console.log("Success! Columns have been added.");
    
    // Check the columns to verify
    const [rows] = await pool.query('SHOW COLUMNS FROM rajlaksmi_payment');
    console.log("Current Columns:", rows.map(r => r.Field));
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist. Skipping...");
    } else {
      console.error("Error updating table:", err);
    }
  }
  process.exit(0);
}

run();
