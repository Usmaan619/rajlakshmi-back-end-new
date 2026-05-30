const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/home/kali/work/RajlaxmiNew/backend/.env' });

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT || 3306
    });

    console.log("Connected to", process.env.DB_DATABASE);

    const [columns] = await connection.execute("DESCRIBE rajlaksmi_product");
    const fields = columns.map(c => c.Field);

    const newColumns = [
      { name: 'why_choose', definition: 'ALTER TABLE rajlaksmi_product ADD COLUMN why_choose TEXT NULL AFTER ingredients' },
      { name: 'storage_instructions', definition: 'ALTER TABLE rajlaksmi_product ADD COLUMN storage_instructions TEXT NULL AFTER why_choose' },
      { name: 'common_uses', definition: 'ALTER TABLE rajlaksmi_product ADD COLUMN common_uses TEXT NULL AFTER storage_instructions' }
    ];

    for (const col of newColumns) {
      if (!fields.includes(col.name)) {
        console.log(`Adding ${col.name} column...`);
        await connection.execute(col.definition);
        console.log(`Column ${col.name} added successfully!`);
      } else {
        console.log(`Column ${col.name} already exists.`);
      }
    }

    await connection.end();
    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration error:", err.message);
  }
})();
