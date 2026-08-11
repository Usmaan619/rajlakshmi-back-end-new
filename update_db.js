const { pool } = require('./config/dbConnection');
async function run() {
  try {
    const alterQuery = `
      ALTER TABLE rajlaksmi_home_banners
      MODIFY COLUMN banner1 LONGTEXT,
      MODIFY COLUMN banner2 LONGTEXT,
      MODIFY COLUMN banner3 LONGTEXT,
      MODIFY COLUMN banner4 LONGTEXT;
    `;
    console.log("Altering columns to LONGTEXT...");
    await pool.query(alterQuery);
    console.log("Success! Checking columns...");
    const [rows] = await pool.query('SHOW COLUMNS FROM rajlaksmi_home_banners');
    console.log(rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
