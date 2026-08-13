const fs = require("fs");
const path = require("path");
const { pool } = require("./config/dbConnection");

const runMigration = async () => {
  try {
    const sqlPath = path.join(__dirname, "cart_wishlist_migration.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Split statements by semicolon to execute them one by one
    // Filter out empty statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const connection = await pool.getConnection();

    console.log("Connected to DB, running migrations...");

    for (const statement of statements) {
      if (statement) {
        await connection.execute(statement);
      }
    }

    connection.release();
    console.log("✅ Migrations executed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
