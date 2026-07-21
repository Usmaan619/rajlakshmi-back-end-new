const { withConnection } = require("./utils/helper");

async function check() {
  await withConnection(async (connection) => {
    const [rows] = await connection.execute("DESCRIBE rajlaksmi_offers");
    console.log("Schema:", rows);
    const [data] = await connection.execute("SELECT * FROM rajlaksmi_offers");
    console.log("Data:", data);
  });
  process.exit(0);
}
check();
