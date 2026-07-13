// models/cartModel.js

const moment = require("moment");
const { withConnection } = require("../../utils/helper");

// Find a cart item by product_id and user_id

exports.findCartItem = async (product_id, user_id) => {
  try {
    // Ensure to await the query to resolve the promise
    return await withConnection(async (connection) => {
      const query =
        "SELECT * FROM rajlaksmi_addtocart WHERE product_id = ? AND user_id = ?";
      const [rows] = await connection.execute(query, [product_id, user_id]);

      // Log the results for debugging purposes

      // Return the results (assuming you want the first row)
      return rows;
    });
  } catch (error) {
    try {
      console.log(
        "results:findCartItem2 ----- second catch ",
        error,
        moment().format("MMMM Do YYYY, h:mm:ss a")
      );
      return await withConnection(async (connection) => {
        const query =
          "SELECT * FROM rajlaksmi_addtocart WHERE product_id = ? AND user_id = ?";
        const [rows] = await connection.execute(query, [product_id, user_id]);

        // Log the results for debugging purposes

        // Return the results (assuming you want the first row)
        return rows;
      });
    } catch (error) {
      console.log(
        "error:findCartItem-------2 secound console ",
        error,
        moment().format("MMMM Do YYYY, h:mm:ss a")
      );
    }
  }
};

// Add a new item to the cart

exports.addCartItem = async (cartItem) => {
  try {
    const {
      user_id,
      product_id,
      product_name,
      product_price,
      product_weight,
      product_quantity,
      product_total_amount,
      purchase_price,
    } = cartItem;

    return await withConnection(async (connection) => {
      const query =
        "INSERT INTO rajlaksmi_addtocart (user_id, product_id,product_name, product_price, product_weight, product_quantity, product_total_amount, purchase_price) VALUES (?, ?, ?, ?, ?, ?, ?,?)";

      const [results] = await connection.execute(query, [
        user_id || "",
        product_id || "",
        product_name || "",
        product_price || "",
        product_weight || "",
        product_quantity || "",
        product_total_amount || "",
        purchase_price || "",
      ]);

      return results; // Return the ID of the inserted item or results if needed
    });
  } catch (error) {
    console.error(
      "Error in addCartItem:",
      error,
      moment().format("MMMM Do YYYY, h:mm:ss a")
    );
    throw error; // Rethrow for upstream error handling
  }
};

// Update the quantity and total amount of an existing cart item

exports.updateCartItem = async (
  user_id,
  product_id,
  product_quantity,
  product_total_amount
) => {
  try {
    return await withConnection(async (connection) => {
      const query =
        "UPDATE rajlaksmi_addtocart SET product_quantity = ?, product_total_amount = ? WHERE product_id = ? AND user_id = ?";

      const [results] = await connection.execute(query, [
        product_quantity,
        product_total_amount,
        product_id,
        user_id,
      ]);

      return results.affectedRows; // Return the number of rows affected
    });
  } catch (error) {
    console.error(
      "Error in updateCartItem:",
      error,
      moment().format("MMMM Do YYYY, h:mm:ss a")
    );
    throw error; // Rethrow the error for handling upstream
  }
};

// Function to remove an item from the cart

exports.removeFromCartModal = async (user_id, product_id) => {
  try {
    // Query to delete the cart item for the given product_id and user_id

    return await withConnection(async (connection) => {
      const query =
        "DELETE FROM rajlaksmi_addtocart WHERE product_id = ? AND user_id = ?";

      // Executing the delete query
      const [result] = await connection.execute(query, [product_id, user_id]);
      console.log(
        "result:removeFromCartModal ",
        result,
        moment().format("MMMM Do YYYY, h:mm:ss a")
      );

      // Check if any rows were affected (i.e., if the item was deleted)
      if (result.affectedRows > 0) {
        return { message: "Product removed from cart" };
      } else {
        return { message: "No matching product found in cart" };
      }
    });
  } catch (error) {
    console.error(
      "Error removing product from cart:",
      error,
      moment().format("MMMM Do YYYY, h:mm:ss a")
    );
  }
};
