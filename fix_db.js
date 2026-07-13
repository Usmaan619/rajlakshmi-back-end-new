const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/home/kali/work/RajlaxmiNew/backend/.env' });

(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE
        });

        console.log("Connected to", process.env.DB_DATABASE);

        // Check columns
        const [rows] = await connection.execute("DESCRIBE rajlaksmi_product");
        const hasColumn = rows.some(r => r.Field === 'product_video');

        if (!hasColumn) {
            console.log("Adding product_video column...");
            await connection.execute("ALTER TABLE rajlaksmi_product ADD COLUMN product_video LONGTEXT AFTER product_subtitle");
            console.log("Column added successfully!");
        } else {
            console.log("Column already exists.");
        }

        await connection.end();
    } catch (err) {
        console.error("Error:", err.message);
    }
})();
