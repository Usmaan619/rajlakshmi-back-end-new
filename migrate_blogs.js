require("dotenv").config({ path: __dirname + "/.env" });
const { withConnection } = require("./utils/helper");

(async () => {
  try {
    await withConnection(async (connection) => {
      await connection.execute(
        "ALTER TABLE rajlaksmi_blogs MODIFY COLUMN image_url LONGTEXT;",
      );
      console.log(
        "Successfully altered table rajlaksmi_blogs: image_url is now LONGTEXT",
      );
    });
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    process.exit(0);
  }
})();
