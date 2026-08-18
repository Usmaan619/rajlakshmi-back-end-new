require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    console.log("Connecting to Database...");
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'RLJ_DB',
        port: process.env.DB_PORT || 3306
    });

    try {
        const queries = [
            "ALTER TABLE orders ADD COLUMN shipping_charge DECIMAL(10,2) DEFAULT 0;",
            "ALTER TABLE orders ADD COLUMN gst_amount DECIMAL(10,2) DEFAULT 0;",
            "ALTER TABLE orders ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0;"
        ];

        for (const query of queries) {
            try {
                await connection.query(query);
                console.log(`✅ Success: Executed query`);
            } catch (err) {
                // If column already exists (Error 1060: Duplicate column name)
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column already exists, skipping.`);
                } else {
                    console.error(`❌ Error:`, err.message);
                }
            }
        }
        console.log("🎉 Migration completed successfully!");
    } finally {
        await connection.end();
    }
}
migrate();
