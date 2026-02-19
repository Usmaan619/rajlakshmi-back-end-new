const { withConnection } = require("../../utils/helper");

// Save contact information to the database
exports.contact = async (userTable) => {
  try {
    const { user_name, user_email, user_mobile, user_subject, user_message } =
      userTable;

    return await withConnection(async (connection) => {
      // SQL query
      const query = `
    INSERT INTO gauswarn_contact (
      user_name,
      user_email,
      user_mobile,
      user_subject,
      user_message
    ) VALUES (?, ?, ?, ?, ?)
  `;

      // Execute the query with the user data
      const [results] = await connection.execute(query, [
        user_name,
        user_email,
        user_mobile,
        user_subject,
        user_message,
      ]);

      return results; // Return query results if needed
    });
  } catch (error) {
    console.error("Database error:", error); // Log the error for debugging
    throw new Error("Error saving contact information to the database.");
  }
};

// Get All contact
exports.getAllContact = async () => {
  try {
    return await withConnection(async (connection) => {
      const query = "SELECT * FROM gauswarn_contact";
      const [contact] = await connection.execute(query);
      return contact;
    });
  } catch (error) {
    throw new Error(error.message);
  }
};
