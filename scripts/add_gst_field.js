const mysql = require("mysql2/promise");
require("dotenv").config({ path: require('path').join(__dirname, '../.env') });

async function addGstField() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  });

  try {
    console.log("Checking if gst_percent column exists in rajlaksmi_product...");
    const [rows] = await connection.execute("DESCRIBE rajlaksmi_product");
    const hasGst = rows.some(row => row.Field === 'gst_percent');

    if (!hasGst) {
      console.log("Adding gst_percent column to rajlaksmi_product...");
      await connection.execute("ALTER TABLE rajlaksmi_product ADD COLUMN gst_percent DECIMAL(5,2) DEFAULT 0");
      console.log("Column added successfully!");
    } else {
      console.log("gst_percent column already exists.");
    }
  } catch (error) {
    console.error("Error updating database:", error);
  } finally {
    await connection.end();
  }
}

addGstField();
