const crypto = require("crypto");

// Generate checksum
async function generateChecksumForPhonePe(payload) {
  try {
    const sha256 = crypto
      .createHash("sha256")
      .update(payload + "/pg/v1/pay" + process.env.PHONEPE_MERCHANT_KEY)
      .digest("hex");
    return sha256 + "###" + Number(process.env.SALT_INDEX);
  } catch (error) {
    throw error;
  }
}

async function generateMergedKey(user_name, user_mobile_num, orderId) {
  // Extract required parts
  const namePart = user_name.substring(0, 4); // First 4 letters of user_name
  const mobilePart = user_mobile_num.substring(0, 6); // First 6 digits of user_mobile_num

  // Combine the parts into a single key
  const mergedKey = `${namePart}_${orderId}_${mobilePart}`;

  return mergedKey;
}

module.exports = {
  generateChecksumForPhonePe,
  generateMergedKey
};
