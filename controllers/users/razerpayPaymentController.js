const Razorpay = require("razorpay");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const { withConnection, calculateTotalWeight } = require("../../utils/helper");
const { pool } = require("../../config/dbConnection");

/* =============================
   RAZORPAY INSTANCE
============================= */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_yxHWWlu9sVA1sQ",
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =============================
   HELPERS
============================= */
const getCurrentTime = () => new Date().toTimeString().slice(0, 8);

const validateCartForShopmozo = (cart) => {
  return cart && Array.isArray(cart) && cart.length > 0;
};

const sendWhatsAppNotification = async (mobile, orderId, amount) => {
  try {
    const message = `Thank you for your order! Order ID: ${orderId}, Amount: ₹${amount}. Your Gauswarn Ghee order has been confirmed.`;
    const whatsappApiUrl = `https://bhashsms.com/api/sendmsg.php?user=RAJLAKSHMIBWA&pass=123456&sender=BUZWAP&phone=${mobile}&text=${encodeURIComponent(
      message,
    )}&priority=wa&stype=normal`;

    const response = await axios.get(whatsappApiUrl, { timeout: 5000 });
    if (response.status !== 200) {
      throw new Error(`WhatsApp API failed: ${response.data}`);
    }
    return response.data;
  } catch (error) {
    console.error("WhatsApp notification failed:", error.message);
    // Don't throw - don't fail payment for WhatsApp issues
  }
};

/* =============================
   SHOPMOZO ORDER (IMPROVED)
============================= */
const generateShopmozoOrder = async (userData, cart, date) => {
  if (!validateCartForShopmozo(cart)) {
    console.warn("ℹ️ Cart is empty – Skipping Shopmozo integration");
    return `ORD_${uuidv4().slice(0, 8)}_${Date.now()}`; // Return local order ID
  }

  const payload = {
    order_id: `ORD_${uuidv4().slice(0, 8)}_${Date.now()}`,
    order_date: date,
    order_type: "ESSENTIALS",

    consignee_name: userData.user_name,
    consignee_phone: Number(userData.user_mobile_num),
    // consignee_alternate_phone: Number(userData.user_mobile_num),
    consignee_email: userData.user_email,
    consignee_address_line_one: userData.user_house_number,
    consignee_address_line_two: userData.user_landmark,
    consignee_pin_code: Number(userData.user_pincode),
    consignee_city: userData.user_city,
    consignee_state: userData.user_state,

    product_detail: cart.map((item) => ({
      name: item.product_name || item.name || "Ghee",
      sku_number: item.sku || item.product_id || "SKU001",
      quantity: Number(item.quantity || item.product_quantity || 1),
      discount: item.discount || "",
      hsn: item.hsn || "17021190",
      unit_price: Number(item.price || item.product_price || 0),
      product_category: item.category || "Ghee",
    })),

    payment_type: "PREPAID",
    cod_amount: "",
    shipping_charges: "",
    weight: calculateTotalWeight(cart),
    warehouse_id: process.env.SHOPMOZO_WAREHOUSE_ID || "43190",
    gst_ewaybill_number: "",
    gstin_number: "",
  };

  try {
    console.log("📦 Creating Shopmozo order...");
    const response = await axios.post(
      "https://shipping-api.com/app/api/v1/push-order",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "private-key":
            process.env.SHOPMOZO_PRIVATE_KEY || "G0K1PQYBq3Xlph6y48gw",
          "public-key":
            process.env.SHOPMOZO_PUBLIC_KEY || "LBYfQgGFRljv1A249H87",
        },
        timeout: 10000,
      },
    );
    console.log(
      "response:--------------------------------------------- ",
      response,
    );

    if (response.data?.result === "1") {
      const shopmozoOrderId = response.data.data.order_id;
      let awbNumber = null;
      console.log(" Shopmozo order created:", shopmozoOrderId);
      
      // Auto Assign Courier
      try {
        const assignRes = await axios.post(
          "https://shipping-api.com/app/api/v1/auto-assign-order",
          { order_id: shopmozoOrderId },
          {
            headers: {
              "private-key": process.env.SHOPMOZO_PRIVATE_KEY || "G0K1PQYBq3Xlph6y48gw",
              "public-key": process.env.SHOPMOZO_PUBLIC_KEY || "LBYfQgGFRljv1A249H87",
            },
          }
        );
        if (assignRes.data?.result === "1") {
           awbNumber = assignRes.data.data.awb;
           console.log(" Courier auto-assigned, AWB:", awbNumber);
        }
      } catch (autoErr) {
        console.error(" Courier Auto-Assign failed:", autoErr.message);
      }

      return { shopmozoOrderId, awbNumber };
    } else {
      console.warn("⚠️ Shopmozo rejected:", response.data?.message);
      return payload.order_id; // Fallback to local order ID
    }
  } catch (err) {
    console.error("===== SHOPMOZO ERROR =====");
    console.error("Status:", err.response?.status);
    console.error("Data:", err.response?.data);
    console.error("=========================");
    return payload.order_id; // Fallback to local order ID
  }
};

/* =============================
   SAVE PAYMENT (DB) - ENHANCED
============================= */
const savePaymentDetails = async (userData, shopmozoOrderId, cart = []) => {
  const date = moment().format("YYYY-MM-DD");
  const time = getCurrentTime();

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    /* 1️⃣ SAVE TO rajlaksmi_payment */
    const queryPayment = `
      INSERT INTO rajlaksmi_payment
      (
        user_id, user_name, user_mobile_num, user_email, user_state, user_city,
        user_country, user_house_number, user_landmark, user_pincode,
        user_total_amount, purchase_price, product_quantity,
        date, time, shopmozo_order_id, status, isPaymentPaid, cart_data
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', false, ?)
    `;

    const [paymentResult] = await connection.execute(queryPayment, [
      userData.user_id,
      userData.user_name,
      userData.user_mobile_num,
      userData.user_email,
      userData.user_state,
      userData.user_city,
      userData.user_country,
      userData.user_house_number,
      userData.user_landmark,
      userData.user_pincode,
      userData.user_total_amount,
      userData.purchase_price,
      userData.product_quantity,
      date,
      time,
      shopmozoOrderId,
      JSON.stringify(cart),
    ]);
    const paymentId = paymentResult.insertId;

    /* 2️⃣ SAVE TO orders */
    const [orderResult] = await connection.execute(
      "INSERT INTO orders (user_id, total_amount, shipping_address_id, payment_method, status, payment_status, shopmozo_order_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        userData.user_id,
        userData.user_total_amount,
        userData.shipping_address_id,
        userData.payment_method || "ONLINE",
        "pending",
        "pending",
        shopmozoOrderId,
      ],
    );
    const orderId = orderResult.insertId;

    /* 3️⃣ SAVE TO order_items */
    if (cart && cart.length > 0) {
      const itemValues = cart.map((item) => [
        orderId,
        item.id,
        item.name,
        item.quantity,
        item.price,
        item.weight || null,
        item.image || (item.product_images && item.product_images[0]) || null,
      ]);

      await connection.query(
        "INSERT INTO order_items (order_id, product_id, product_name, quantity, price, weight, product_image) VALUES ?",
        [itemValues],
      );
    }

    await connection.commit();
    return { paymentId, orderId };
  } catch (error) {
    await connection.rollback();
    console.error("❌ DB Transaction Error:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};

/* =============================
   VALIDATE INPUT
============================= */
const validatePaymentInput = (userData) => {
  const requiredFields = [
    "user_name",
    "user_mobile_num",
    "user_email",
    "user_state",
    "user_city",
    "user_country",
    "user_house_number",
    "user_pincode",
    "user_total_amount",
    "purchase_price",
    "product_quantity",
    "user_id",
  ];

  for (const field of requiredFields) {
    if (userData[field] === undefined || userData[field] === null || userData[field] === "") {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const amount = Number(userData.user_total_amount);
  if (amount <= 0 || amount > 500000) {
    throw new Error("Invalid amount (must be between ₹1 - ₹5,00,000)");
  }

  if (!/^\d{10}$/.test(String(userData.user_mobile_num))) {
    throw new Error("Invalid mobile number format (must be 10 digits)");
  }

  return true;
};

/* =============================
   CREATE PAYMENT (MAIN)
============================= */
const createPaymentAndGenerateUrlRazor = async (req, res) => {
  try {
    const userData = req.body;

    // Input validation
    validatePaymentInput(userData);

    const amountInPaise = Number(userData.user_total_amount) * 100;

    console.log(
      "🛒 Payment initiation for:",
      userData.user_name,
      "Amount: ₹",
      userData.user_total_amount,
    );

    /* 1️⃣ SAVE TO DB (temporary order id) */
    const tempOrderId = `TEMP_${Date.now()}`;

    const { paymentId, orderId } = await savePaymentDetails(
      userData,
      tempOrderId,
      userData.cart || [],
    );

    /* 2️⃣ RAZORPAY ORDER */
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: tempOrderId,
      notes: {
        paymentId: paymentId.toString(),
        orderId: orderId.toString(),
        user_name: userData.user_name,
        user_email: userData.user_email,
        user_mobile_num: userData.user_mobile_num,
        cart: userData.cart || [],
      },
    });

    /* 3️⃣ JWT TOKEN */
    const token = jwt.sign(
      {
        paymentId,
        amount: amountInPaise,
        user_name: userData.user_name,
        user_email: userData.user_email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    console.log("Payment order created:", razorpayOrder.id);

    res.json({
      success: true,
      message: "Payment initiated successfully",
      razorpay_order_id: razorpayOrder.id,
      razorpay_order: razorpayOrder,
      token,
      timestamp: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  } catch (err) {
    console.error("❌ PAYMENT INIT ERROR:", err.message);
    res.status(400).json({
      success: false,
      message: err.message || "Payment initiation failed",
    });
  }
};

// const createPaymentAndGenerateUrlRazor = async (req, res) => {
//   try {
//     const userData = req.body;

//     //  Input validation
//     validatePaymentInput(userData);

//     const amountInPaise = Number(userData.user_total_amount) * 100;
//     const date = moment().format("YYYY-MM-DD");

//     console.log(
//       "🛒 Payment initiation for:",
//       userData.user_name,
//       "Amount: ₹",
//       userData.user_total_amount,
//     );

//     /* 1️⃣ SHOPMOZO (OPTIONAL) */
//     const shopmozoOrderId = await generateShopmozoOrder(
//       userData,
//       userData.cart,
//       date,
//     );

//     /* 2️⃣ SAVE TO DB */
//     const userId = await savePaymentDetails(
//       userData,
//       shopmozoOrderId,
//       userData.cart || [],
//     );

//     /* 3️⃣ RAZORPAY ORDER */
//     const razorpayOrder = await razorpay.orders.create({
//       amount: amountInPaise,
//       currency: "INR",
//       receipt: shopmozoOrderId,
//       notes: {
//         userId: userId.toString(),
//         shopmozo_order_id: shopmozoOrderId,
//         user_name: userData.user_name,
//         user_email: userData.user_email,
//         user_mobile_num: userData.user_mobile_num,
//         cart: userData.cart || [],
//       },
//     });

//     /* 4️⃣ JWT TOKEN */
//     const token = jwt.sign(
//       {
//         userId,
//         orderId: shopmozoOrderId,
//         amount: amountInPaise,
//         user_name: userData.user_name,
//         user_email: userData.user_email,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "15m" },
//     );

//     console.log(" Payment order created:", razorpayOrder.id);

//     res.json({
//       success: true,
//       message: "Payment initiated successfully",
//       razorpay_order_id: razorpayOrder.id,
//       razorpay_order: razorpayOrder,
//       shopmozo_order_id: shopmozoOrderId,
//       has_shopmozo: validateCartForShopmozo(userData.cart),
//       token,
//       timestamp: moment().format("MMMM Do YYYY, h:mm:ss a"),
//     });
//   } catch (err) {
//     console.error("❌ PAYMENT INIT ERROR:", err.message);
//     res.status(400).json({
//       success: false,
//       message: err.message || "Payment initiation failed",
//     });
//   }
// };

/* =============================
   VERIFY PAYMENT (WEBHOOK)
============================= */

const getRazorpayStatusAndUpdatePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body?.rzpResponse || {};
    const notes = req.body?.notes || {};

    console.log("🔍 Verifying payment:", razorpay_payment_id);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay params",
      });
    }

    // Signature verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Invalid signature");
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Fetch payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const isPaid = payment.status === "captured";

    let shopmozoOrderId = null;
    let awbNumber = null;

    if (isPaid) {
      // Fetch user data
      const [[userRow]] = await withConnection((conn) =>
        conn.execute(`SELECT * FROM rajlaksmi_payment WHERE id=?`, [
          notes.paymentId || notes.userId,
        ]),
      );

      // Create Shopmozo order
      const shipResult = await generateShopmozoOrder(
        userRow,
        JSON.parse(userRow.cart_data || "[]"),
        moment().format("YYYY-MM-DD"),
      );
      if (shipResult && typeof shipResult === "object") {
        shopmozoOrderId = shipResult.shopmozoOrderId;
        awbNumber = shipResult.awbNumber; 
      } else {
        shopmozoOrderId = shipResult;
      }
    }

    // Update database
    await withConnection((conn) =>
      conn.execute(
        `UPDATE rajlaksmi_payment
         SET status=?, paymentDetails=?, isPaymentPaid=?, razorpay_payment_id=?, shopmozo_order_id=?
         WHERE id=?`,
        [
          payment.status,
          JSON.stringify(payment),
          isPaid,
          razorpay_payment_id,
          shopmozoOrderId,
          notes.paymentId || notes.userId,
        ],
      ),
    );

    // Update orders table
    if (notes.orderId) {
      await withConnection((conn) =>
        conn.execute(
          `UPDATE orders SET status=?, payment_status=?, shopmozo_order_id=?, awb_number=? WHERE id=?`,
          [
            isPaid ? "processing" : "pending",
            isPaid ? "completed" : (payment.status === "failed" ? "failed" : "pending"),
            shopmozoOrderId || null,
            awbNumber || null, 
            notes.orderId,
          ],
        ),
      );
    }

    // WhatsApp notification
    if (isPaid && notes.user_mobile_num) {
      sendWhatsAppNotification(
        notes.user_mobile_num,
        shopmozoOrderId,
        payment.amount / 100,
      );
    }

    console.log("Payment verification:", payment.status);

    res.json({
      success: isPaid,
      message: isPaid ? "Payment successful" : "Payment authorized",
      payment_status: payment.status,
      shopmozo_order_id: shopmozoOrderId,
    });
  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};

// const getRazorpayStatusAndUpdatePayment = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//       req.body?.rzpResponse || {};
//     const notes = req.body?.notes || {};

//     console.log("🔍 Verifying payment:", razorpay_payment_id);

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing Razorpay params",
//       });
//     }

//     //  Signature verification
//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       console.error("❌ Invalid signature");
//       return res.status(400).json({
//         success: false,
//         message: "Invalid signature",
//       });
//     }

//     //  Fetch payment details
//     const payment = await razorpay.payments.fetch(razorpay_payment_id);
//     const isPaid = payment.status === "captured";

//     //  Update database
//     await withConnection((conn) =>
//       conn.execute(
//         `UPDATE rajlaksmi_payment
//          SET status=?, paymentDetails=?, isPaymentPaid=?, razorpay_payment_id=?
//          WHERE user_id=?`,
//         [
//           payment.status,
//           JSON.stringify(payment),
//           isPaid,
//           razorpay_payment_id,
//           notes.userId,
//         ],
//       ),
//     );

//     //  WhatsApp notification for success
//     if (isPaid && notes.user_mobile_num) {
//       sendWhatsAppNotification(
//         notes.user_mobile_num,
//         notes.shopmozo_order_id,
//         payment.amount / 100,
//       );
//     }

//     console.log(" Payment verification:", payment.status);

//     res.json({
//       success: isPaid,
//       message: isPaid ? "Payment successful" : "Payment authorized",
//       payment_status: payment.status,
//     });
//   } catch (err) {
//     console.error("❌ VERIFY ERROR:", err);
//     res.status(500).json({
//       success: false,
//       message: "Verification failed",
//     });
//   }
// };

/* =============================
   CHECK PAYMENT STATUS
============================= */
const checkRazorpayPaymentStatus = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const payment = await razorpay.payments.fetch(payment_id);

    res.json({
      success: true,
      payment_status: payment.status,
      amount: payment.amount / 100,
      order_id: payment.order_id,
      captured: payment.captured,
    });
  } catch (err) {
    console.error("Payment status check failed:", err.message);
    res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }
};

/* =============================
   EXPORTS
============================= */
module.exports = {
  createPaymentAndGenerateUrlRazor,
  getRazorpayStatusAndUpdatePayment,
  checkRazorpayPaymentStatus,
};
