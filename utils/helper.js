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

const calculateTotalWeight = (items) => {
  return items.reduce((acc, item) => {
    let weight = 0;
    if (typeof item.weight === "number") {
      weight = item.weight;
    } else if (typeof item.weight === "string") {
      const match = item.weight.match(/([\d.]+)\s*(kg|gm|g|ml|l)/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if (unit === "kg" || unit === "l") weight = val;
        else if (unit === "gm" || unit === "g" || unit === "ml")
          weight = val / 1000;
      } else {
        weight = parseFloat(item.weight) || 0.5;
      }
    } else {
      weight = 0.5;
    }
    return acc + weight * (item.quantity || 1);
  }, 0);
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
  calculateTotalWeight,
};
