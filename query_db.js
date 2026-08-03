const { pool } = require('./config/dbConnection');
async function test() {
  const [rows] = await pool.query('SELECT weight FROM products LIMIT 10');
  console.log(rows);
  process.exit(0);
}
test();
