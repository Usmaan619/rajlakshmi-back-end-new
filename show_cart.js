const { pool } = require('./config/dbConnection');
async function test() {
  try {
    const [rows] = await pool.query('SHOW COLUMNS FROM rajlaksmi_addtocart');
    console.log(rows.map(r => r.Field));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
