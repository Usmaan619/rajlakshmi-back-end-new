// controllers/paymentController.js

const { default: axios } = require("axios");
const db = require("../../config/dbConnection");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const {
  generateChecksumForPhonePe,
  generateMergedKey,
} = require("../../utils/payment.service");
const moment = require("moment");

const jwt = require("jsonwebtoken");

const { withConnection } = require("../../utils/helper");

const createPaymentAndGenerateUrl = async (req, res) => {
  // const { status, amount, name, mobileNumber } = req.body;
  const {
    user_name,
    user_mobile_num,
    user_email,
    user_state,
    user_city,
    user_country,
    user_house_number,
    user_landmark,
    user_pincode,
    user_total_amount,
    purchase_price,
    product_quantity,
    cart,
  } = req.body;

  // Validate the payload
  if (
    !user_name ||
    !user_mobile_num ||
    !user_email ||
    !user_state ||
    !user_city ||
    !user_country ||
    !user_house_number ||
    !user_landmark ||
    !user_pincode ||
    !user_total_amount ||
    !purchase_price ||
    !product_quantity
  ) {
    return res.json({ success: false, message: "All fields are required." });
  }

  const date = moment().format("YYYY-MM-DD");
  const time = getCurrentTime();

  // Convert user_total_amount to paise for PhonePe
  const amountInPaise = user_total_amount * 100;

  // Insert user details into the database
  const userQuery = `INSERT INTO gauswarn_payment (user_name, user_mobile_num, user_email, user_state, user_city, user_country, user_house_number, user_landmark, user_pincode, user_total_amount, purchase_price, product_quantity, date, time)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  try {
    const [result] = await withConnection(async (connection) => {
      return connection.execute(userQuery, [
        user_name,
        user_mobile_num,
        user_email,
        user_state,
        user_city,
        user_country,
        user_house_number,
        user_landmark,
        user_pincode,
        user_total_amount,
        purchase_price,
        product_quantity,
        date,
        time,
      ]);
    });

    // Get the inserted user ID (if needed for future use)
    const userId = result.insertId;

    const getOrderIdByShopmozy = await generateShopmozyAPI(
      user_name,
      user_mobile_num,
      user_email,
      user_state,
      user_city,
      user_house_number,
      user_landmark,
      user_pincode,
      cart,
      date
    );

    // Create a unique order ID
    const orderId = uuidv4();

    const mergedKey = await generateMergedKey(
      user_name,
      user_mobile_num,
      orderId
    ); // Create the merged key

    // Create a JWT for secure data exchange
    const token = jwt.sign(
      {
        userId,
        user_name,
        user_email,
        orderId,
        amountInPaise,
      },
      process.env.JWT_SECRET, // Use a strong secret key from your environment
      { expiresIn: "6m" } // Token expires in 6 minutes
    );

    // Define the payment payload for PhonePe
    const paymentPayload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantUserId: user_name, // Use userId if needed
      mobileNumber: user_mobile_num,
      amount: amountInPaise, // Use the amount in paise for PhonePe
      merchantTransactionId: orderId,
      redirectUrl: `${process.env.REDIRECT_URL_TO_BACKEND_API}/?id=${orderId}&tarnId=${userId}&mobNo=${user_mobile_num}&amount=${user_total_amount}&orderId=${getOrderIdByShopmozy}`,
      redirectMode: "POST",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // Encode the payload into Base64 format
    const payload = Buffer.from(JSON.stringify(paymentPayload)).toString(
      "base64"
    );

    // Generate the checksum for PhonePe request
    const checksum = await generateChecksumForPhonePe(payload);

    // Configure the request options for PhonePe API
    const option = {
      method: "POST",
      url: process.env.PHONEPE_MERCHANT_BASE_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payload,
      },
    };

    // Make the API request to PhonePe
    const response = await axios.request(option);

    // Extract the redirect URL from PhonePe's response
    const redirectUrl = response.data.data.instrumentResponse.redirectInfo.url;

    if (!redirectUrl) {
      throw new Error("Redirect URL not found in PhonePe response");
    }

    // Respond with the created payment record and PhonePe URL
    res.json({
      success: true,
      massage: "OK",
      url: redirectUrl,
      token, // Include JWT in response
      mergedKey, // Include the generated key
      date: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  } catch (error) {
    // Send an error response to the client
    res.status(500).json({
      success: false,
      message: "Failed to create payment or generate URL",
      error: error.message,
    });
  }
};

const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hoursStr = String(hours).padStart(2, "0");
  const minutesStr = String(minutes).padStart(2, "0");
  const secondsStr = String(seconds).padStart(2, "0");

  return `${hoursStr}:${minutesStr}:${secondsStr}`;
};

const getPhonePeUrlStatusAndUpdatePayment = async (req, res) => {
  const merchantTransactionId = req?.query?.id;
  const tarnId = req?.query?.tarnId;

  const mobNo = req?.query?.mobNo;
  const amount = req?.query?.amount;
  const orderId = req?.query?.orderId;

  const keyIndex = process.env.SALT_INDEX;
  const string =
    `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}` +
    process.env.PHONEPE_MERCHANT_KEY;
  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  const checksum = sha256 + "###" + keyIndex;

  const option = {
    method: "GET",
    url: `${process.env.PHONEPE_MERCHANT_STATUS_URL}/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": checksum,
      "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
    },
  };

  try {
    const response = await axios.request(option);
    const paymentStatus = response.data.code;
    const paymentDetails = response.data;

    // Update payment status in the database
    const query = `UPDATE gauswarn_payment SET status = ?, paymentDetails = ?, isPaymentPaid = ? WHERE user_id = ?`;
    const isPaymentPaid = paymentStatus === "true";

    const [result] = await withConnection(async (connection) => {
      return connection.execute(query, [
        paymentStatus,
        JSON.stringify(paymentDetails),
        isPaymentPaid,
        tarnId,
      ]);
    });

    if (result === 0) {
      return res.json({ success: false, message: "Payment record not found." });
    }
    // const whatsappApiUrl = `https://bhashsms.com/api/sendmsg.php?user=RAJLAKSHMIBWA&pass=123456&sender=BUZWAP&phone=${user_mobile_num}&text=gauswarn_ghee002&priority=wa&stype=normal&Params=${ordeId},${user_total_amount}&htype=image&url=https://i.ibb.co/p6P86j3J/Whats-App-Image-2025-02-17-at-12-46-41.jpg`;
    if (response?.data?.code === "PAYMENT_SUCCESS") {
      const result = await sendWhatsAppMessage(mobNo, orderId, amount);

      return res.redirect(process.env.REDIRECT_URL_TO_SUCCESS_PAGE);
    }

    if (response?.data?.code === "PAYMENT_ERROR") {
      return res.redirect(process.env.REDIRECT_URL_TO_FAILURE_PAGE);
    }
  } catch (err) {
    console.error(
      "Error fetching PhonePe status or updating database:",
      err.message
    );
    return res.status(500).json({ success: false, error: err.message });
  }
};

async function sendWhatsAppMessage(user_mobile_num, ordeId, user_total_amount) {
  const whatsappApiUrl = `https://bhashsms.com/api/sendmsg.php?user=RAJLAKSHMIBWA&pass=123456&sender=BUZWAP&phone=${user_mobile_num}&text=gauswarn_ghee002&priority=wa&stype=normal&Params=${ordeId},${user_total_amount}&htype=image&url=https://i.ibb.co/p6P86j3J/Whats-App-Image-2025-02-17-at-12-46-41.jpg`;

  try {
    const response = await axios.get(whatsappApiUrl);

    if (!response.status === 200) {
      throw new Error(`API error: ${response.data.message}`);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
}

async function generateShopmozyAPI(
  user_name,
  user_mobile_num,
  user_email,
  user_state,
  user_city,
  user_house_number,
  user_landmark,
  user_pincode,
  cart,
  date
) {
  try {
    const ShippingPayLoad = {
      order_id: "ordID",
      order_date: date,
      order_type: "ESSENTIALS",
      consignee_name: user_name,
      consignee_phone: Number(user_mobile_num),
      consignee_alternate_phone: Number(user_mobile_num),
      consignee_email: user_email,
      consignee_address_line_one: user_house_number,
      consignee_address_line_two: user_landmark,
      consignee_pin_code: user_pincode,
      consignee_city: user_city,
      consignee_state: user_state,
      product_detail: cart?.map((i) => {
        return {
          name: i?.product_name,
          sku_number: "22",
          quantity: i?.product_quantity,
          discount: "",
          hsn: "#123",
          unit_price: i?.product_price,
          product_category: "Ghee",
        };
      }),
      payment_type: "PREPAID",
      cod_amount: "",
      shipping_charges: "",
      weight: 200,
      length: 10,
      width: 20,
      height: 15,
      warehouse_id: "",
      gst_ewaybill_number: "",
      gstin_number: "",
    };

    const apiResponse = await axios.post(
      `https://shipping-api.com/app/api/v1/push-order`,
      ShippingPayLoad,
      {
        headers: {
          "Content-Type": "application/json",
          "private-key": "G0K1PQYBq3Xlph6y48gw",
          "public-key": "LBYfQgGFRljv1A249H87",
        },
      }
    );
    return apiResponse?.data?.data?.order_id;
  } catch (error) {}
}

module.exports = {
  createPaymentAndGenerateUrl,
  getPhonePeUrlStatusAndUpdatePayment,
};
