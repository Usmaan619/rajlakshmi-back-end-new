const { withConnection } = require("../../utils/helper");

exports.getAllUserInfo = async () => {
  try {
    return await withConnection(async (connection) => {
      const query = `
        SELECT 
          user_id,
          user_name,
          user_email,
          user_state,
          user_city,
          user_country,
          user_house_number,
          user_landmark,
          user_pincode,
          user_mobile_num,
          user_total_amount,
          STATUS,     
          date,
          time
        FROM rajlaksmi_payment;
      `;

      const [rows] = await connection.execute(query);
      return rows;
    });
  } catch (error) {
    console.error("Error in getAllUserInfo:", error);
    throw error;
  }
};

// Fetch all getAllUserInfo Ghee-web-app single-page payment-table
// exports.getAllOrderDetails = async () => {
//   try {
//     return await withConnection(async (connection) => {
//       const query = `
//         SELECT user_id, user_name, user_email, user_state, user_city, user_country, user_house_number, user_landmark, user_pincode, user_mobile_num, user_total_amount, STATUS , paymentDetails, isPaymentPaid, id, DATE, TIME FROM rajlaksmi_payment WHERE STATUS = 'captured';
//       `;

//       const [rows] = await connection.execute(query);
//       return rows;
//     });
//   } catch (error) {
//     console.error("Error in getAllOrderDetails:", error);
//     throw error;
//   }
// };

exports.getAllOrderDetails = async () => {
  try {
    return await withConnection(async (connection) => {
      const query = `
        SELECT 
          user_id, 
          user_name, 
          user_email, 
          user_state, 
          user_city, 
          user_country, 
          user_house_number, 
          user_landmark, 
          user_pincode, 
          user_mobile_num, 
          user_total_amount, 
          STATUS,
          paymentDetails, 
          isPaymentPaid, 
          id, 
          DATE, 
          TIME 
        FROM rajlaksmi_payment
         ORDER BY date DESC, time DESC;
      `;

      const [rows] = await connection.execute(query);
      return rows;
    });
  } catch (error) {
    console.error("Error in getAllOrderDetails:", error);
    throw error;
  }
};

exports.updateOrderStatus = async (id, status) => {
  return await withConnection(async (connection) => {
    try {
      await connection.beginTransaction();

      // Get shopmozo_order_id first to update the orders table as well
      const [orderRows] = await connection.execute(
        "SELECT shopmozo_order_id FROM rajlaksmi_payment WHERE id = ?",
        [id],
      );

      // Update rajlaksmi_payment table
      const query1 = `
        UPDATE rajlaksmi_payment
        SET status = ?
        WHERE id = ?
      `;
      await connection.execute(query1, [status, id]);

      // Map status for orders table ENUM requirements
      const statusMapping = {
        Pending: "pending",
        Shipped: "shipped",
        Delivered: "delivered",
        Cancel: "cancelled",
      };
      const dbStatus = statusMapping[status] || status.toLowerCase();

      // If we have a shopmozo_order_id, update the orders table too
      if (orderRows.length > 0 && orderRows[0].shopmozo_order_id) {
        const shopmozoOrderId = orderRows[0].shopmozo_order_id;
        const query2 = `
          UPDATE orders
          SET status = ?
          WHERE shopmozo_order_id = ?
        `;
        await connection.execute(query2, [dbStatus, shopmozoOrderId]);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error("Error updating order status:", error);
      throw error;
    }
  });
};
