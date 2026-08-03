const { pool } = require('./config/dbConnection');
async function test() {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    console.log(rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
