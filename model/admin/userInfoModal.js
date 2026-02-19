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
        FROM gauswarn_payment;
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
//         SELECT user_id, user_name, user_email, user_state, user_city, user_country, user_house_number, user_landmark, user_pincode, user_mobile_num, user_total_amount, STATUS , paymentDetails, isPaymentPaid, id, DATE, TIME FROM gauswarn_payment WHERE STATUS = 'captured';
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
        FROM gauswarn_payment;
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
    const query = `
      UPDATE gauswarn_payment
      SET status = ?
      WHERE user_id = ?
    `;
    await connection.execute(query, [status, id]);
    return true;
  });
};
