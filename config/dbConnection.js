const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  // Allow large payloads (base64 images can be several MB each)
  // 256 MB – adjust down if your MySQL server is constrained
  maxAllowedPacket: 268435456,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log("dbConfig:----------- ", {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
});

// Create a shared pool instead of per-request single connections.
// Pools reuse connections AND respect max_allowed_packet negotiated at connect time.
const pool = mysql.createPool(dbConfig);

// withConnection-compatible: borrows a connection from the pool and
// releases it back automatically – no manual .end() / .destroy() needed.
async function connectToDatabase() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (err) {
    console.error("Error getting DB connection from pool:----------", err);
    throw err;
  }
}

module.exports = { connectToDatabase, pool };
