// Get All Products

const adminUserInfoModal = require("../../model/admin/userInfoModal");
const userModel = require("../../model/users/userModel");
const asyncHandler = require("express-async-handler");
const { pool } = require("../../config/dbConnection");
const { generateInvoicePDF } = require("../../utils/invoiceGenerator");

exports.getAllUserInfo = asyncHandler(async (req, res) => {
  try {
    const customers = await adminUserInfoModal.getAllUserInfo(
      req?.query?.limit
    );
    res.json({ success: true, customers });
  } catch (error) {
    res.json({ error: "Failed to fetch products" });
  }
});

// get user details by payment table
exports.getAllOrderDetails = asyncHandler(async (req, res) => {
  try {
    const orderDetails = await adminUserInfoModal.getAllOrderDetails(
      req?.query?.limit
    );
    res.json({ success: true, orderDetails });
  } catch (error) {
    res.json({ error: "Failed to fetch products" });
  }
});



exports.updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const result = await adminUserInfoModal.updateOrderStatus(id, status);

    res.json({ success: true, message: "Order status updated!" });

  } catch (error) {
    res.json({ success: false, message: "Failed to update" });
  }
});

// Admin Invoice Download - generates PDF from rajlaksmi_payment table
exports.adminDownloadInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT id, user_id, user_name, user_email, user_state, user_city, 
              user_country, user_house_number, user_landmark, user_pincode, 
              user_mobile_num, user_total_amount, cart_data, shipping_charge, 
              gst_amount, platform_fee, discount_amount, coupon_code, 
              shopmozo_order_id, DATE, TIME
       FROM rajlaksmi_payment WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = rows[0];

    // Parse cart_data
    let cartItems = [];
    try {
      if (order.cart_data) {
        cartItems = typeof order.cart_data === "string"
          ? JSON.parse(order.cart_data)
          : order.cart_data;
      }
    } catch (err) {
      console.error("Error parsing cart_data for invoice:", err);
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "No cart items found for this order" });
    }

    // Format user data to match invoiceGenerator expected structure
    const userForInvoice = {
      user_name: order.user_name,
      user_house_number: order.user_house_number,
      user_landmark: order.user_landmark,
      user_city: order.user_city,
      user_state: order.user_state,
      user_pincode: order.user_pincode,
      user_country: order.user_country,
      user_mobile_num: order.user_mobile_num,
      user_email: order.user_email || "",
      shipping_charge: order.shipping_charge,
      gst_amount: order.gst_amount,
      platform_fee: order.platform_fee,
      discount_amount: order.discount_amount,
      user_total_amount: order.user_total_amount,
    };

    const orderId = order.shopmozo_order_id || order.id;

    const pdfBuffer = await generateInvoicePDF(
      { orderId },
      userForInvoice,
      cartItems
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Invoice_${orderId}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Admin Invoice Download Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate invoice" });
  }
});

exports.getRajlaxmiUsers = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await userModel.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      Customer: result.rows,
      total: result.total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch users" });
  }
});
