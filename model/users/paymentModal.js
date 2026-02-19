const db = require("../../../config/dbConnection");

// Example usage
// insertPayment("Completed", { cardNumber: "**** **** **** 1234" }, 150.75, true);

exports.insertPayment = async (
  status,
  paymentDetails,
  amount,
  isPaymentPaid
) => {
  try {
    const query = `INSERT INTO gauswarn_payments (status, paymentDetails, amount, isPaymentPaid) VALUES (?, ?, ?, ?)`;

    await db
      .promise()
      .query(query, [status, paymentDetails, amount, isPaymentPaid]);
  } catch (error) {
    console.log("error:insertPayment ", error);
  }
};


// const schema = new Schema({
//   status: {
//     type: String,
//   },

//   paymentDetails: {
//     type: Object,
//   },

//   amount: {
//     type: Number,
//   },

//   isPaymentPaid: {
//     type: Boolean,
//     default: false,
//   },
// });