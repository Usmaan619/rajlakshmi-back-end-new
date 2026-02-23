const nodemailer = require("nodemailer");
const { connectToDatabase } = require("../config/dbConnection");

const createEmailTransporter = async () => {
  try {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: process.env.SMTP_SIW_USER,
        pass: process.env.SMTP_SIW_PASS,
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });
  } catch (error) {
    console.log("error:createEmailTransporter ", error);
    throw error;
  }
};

// const withConnection = async (callback) => {
//   const connection = await connectToDatabase();
//   try {
//     return await callback(connection);
//   } catch (err) {
//     throw err;
//   } finally {
//     connection.end();
//   }
// };

const withConnection = async (callback) => {
  const connection = await connectToDatabase(); // Borrow a connection from the pool
  try {
    return await callback(connection);
  } catch (err) {
    console.error("Error in withConnection:---------------------", err);
    throw err; // Rethrow the error for higher-level handling
  } finally {
    // Always release back to the pool — never call .end() on a pool connection
    try {
      connection.release();
    } catch (_) {
      // ignore release errors
    }
  }
};

// Function to calculate profit
const calculateProfit = (sellingPrice, purchase_price, product_quantity) => {
  const purchasingPrice = product_quantity * purchase_price;

  const profitPrice = sellingPrice - purchasingPrice;

  return profitPrice;
};

const shortenUUID = (uuid) => {
  const cleanUuid = uuid.replace(/-/g, "");
  return cleanUuid.substring(0, 5);
};

// const kgArray = ["5KG", "10KG", "15KG", "20KG"];
// const ltrArray = ["5LTR", "10LTR", "15LTR", "20LTR"];
const extractIntegers = (arr) =>
  arr.map((item) => parseInt(item.match(/\d+/)[0]));

module.exports = {
  createEmailTransporter,
  withConnection,
  calculateProfit,
  connectToDatabase,
  shortenUUID,
  extractIntegers,
};
