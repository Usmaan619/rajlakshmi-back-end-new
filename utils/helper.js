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

/**
 * Groups cart items by packaging type and returns an accurate dimensions array
 * for the Shipmozo rate-calculator API.
 *
 * Real-world logic:
 *   - Each product type has a known physical box/bag size (cm)
 *   - no_of_box = Math.ceil(groupWeightKg / maxWeightPerBox)
 *   - API receives one dimensions entry per packaging group
 *
 * Example for a mixed order:
 *   - 90kg Ghee  → 3 PP bags (3ft×2ft each)
 *   - 20kg Makhana → 2 large boxes (6ft×3.5ft each)
 *   → dimensions: [ { no_of_box: "3", ...ghee dims }, { no_of_box: "2", ...makhana dims } ]
 *
 * @param {Array} items - Cart items with name, weight, quantity fields
 * @returns {Array} - Dimensions array ready for the shipping API
 */
const getShippingDimensions = (items) => {
  const { detectPackagingProfile } = require("./packagingConfig");

  // Step 1: Group items by their packaging profile key
  const groups = {}; // key: profile.name → { profile, totalWeightKg }

  for (const item of items) {
    const productName = item.name || item.product_name || "";
    const profile = detectPackagingProfile(productName);

    // Parse weight for this item
    let weightKg = 0;
    if (typeof item.weight === "number") {
      weightKg = item.weight;
    } else if (typeof item.weight === "string") {
      const match = item.weight.match(/([\d.]+)\s*(kg|gm|g|ml|l)/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        weightKg = (unit === "kg" || unit === "l") ? val : val / 1000;
      } else {
        weightKg = parseFloat(item.weight) || 0.5;
      }
    } else {
      weightKg = 0.5;
    }

    const itemTotalWeight = weightKg * (item.quantity || 1);

    if (!groups[profile.name]) {
      groups[profile.name] = { profile, totalWeightKg: 0 };
    }
    groups[profile.name].totalWeightKg += itemTotalWeight;
  }

  // Step 2: For each group, calculate number of boxes/bags
  const dimensionsArray = Object.values(groups).map(({ profile, totalWeightKg }) => {
    const numBoxes = Math.max(1, Math.ceil(totalWeightKg / profile.maxWeightKg));
    return {
      no_of_box: String(numBoxes),
      length:    profile.dims.length,
      width:     profile.dims.width,
      height:    profile.dims.height,
      _label:    `${profile.name} × ${numBoxes} (${totalWeightKg.toFixed(1)}kg)`, // for logging only
    };
  });

  return dimensionsArray;
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
  getShippingDimensions,
};
