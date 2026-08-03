const { pool } = require("../../config/dbConnection");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const {
  calculateTotalWeight,
  getShippingDimensions,
} = require("../../utils/helper");

// Address Controllers
const saveAddress = async (req, res) => {
  const {
    user_id,
    full_name,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    pincode,
    country,
    is_default,
  } = req.body;
  try {
    // If setting as default, unset previous default
    if (is_default) {
      await pool.query(
        "UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?",
        [user_id],
      );
    }

    const [result] = await pool.query(
      "INSERT INTO user_addresses (user_id, full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user_id,
        full_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        country,
        is_default,
      ],
    );
    res.status(201).json({
      success: true,
      message: "Address saved successfully",
      address_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAddresses = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
      [user_id],
    );
    res.status(200).json({ success: true, addresses: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAddress = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM user_addresses WHERE id = ?", [id]);
    res
      .status(200)
      .json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Weight Calculation Helper removed, now using helper.js
const getShippingRates = async (req, res) => {
  const { cartItems, pincode } = req.body;

  if (!pincode || !cartItems || cartItems.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Pincode and cart items required" });
  }

  const totalWeight = calculateTotalWeight(cartItems); // in kg

  console.log(JSON.stringify(cartItems), "totalWeight")
  // ─────────────────────────────────────────────────────────────────────────
  // Slab-based Shipping Rate Calculator
  //
  //  0kg  →  5kg  : ₹50 per kg
  //  5kg  →  8kg  : ₹300 flat
  //  8kg  → 40kg  : ₹350 flat
  //  40kg+        : ₹10 per kg
  //
  //  + 18% GST on the base shipping charge
  //
  // To update rates → change only the SHIPPING_SLABS array below.
  // ─────────────────────────────────────────────────────────────────────────
  const SHIPPING_SLABS = [
    { maxKg: 5, ratePerKg: 70, flatRate: null, label: "0–5 kg @ ₹70/kg" },
    { maxKg: 8, ratePerKg: null, flatRate: 300, label: "5–8 kg @ ₹300 flat" },
    { maxKg: 40, ratePerKg: null, flatRate: 350, label: "8–40 kg @ ₹350 flat" },
    { maxKg: Infinity, ratePerKg: 10, flatRate: null, label: "40 kg+ @ ₹10/kg" },
  ];

  const getSlab = (weightKg) => {
    for (const slab of SHIPPING_SLABS) {
      if (weightKg <= slab.maxKg) return slab;
    }
    // Above 5000kg — use last slab rate
    return SHIPPING_SLABS[SHIPPING_SLABS.length - 1];
  };

  const slab = getSlab(totalWeight);
  // For per-kg slabs: round up to nearest whole kg
  // so 500gm (0.5kg) → 1kg → ₹50, NOT ₹25
  const chargeableWeight = Math.ceil(totalWeight);
  const baseShippingCharge =
    slab.flatRate !== null
      ? slab.flatRate
      : parseFloat((chargeableWeight * slab.ratePerKg).toFixed(2));

  const shippingGST = parseFloat((baseShippingCharge * 0.18).toFixed(2));
  const shippingCharge = parseFloat(
    (baseShippingCharge + shippingGST).toFixed(2),
  );

  const isBulkOrder = totalWeight > 8;
  const estimatedDelivery =
    totalWeight <= 8
      ? "3-7 business days"
      : totalWeight <= 100
        ? "5-10 business days"
        : "7-14 business days";

  console.log(
    `📦 Weight: ${totalWeight}kg | Slab: ${slab.label} | Base: ₹${baseShippingCharge} | GST(18%): ₹${shippingGST} | Total: ₹${shippingCharge}`,
  );

  return res.status(200).json({
    success: true,
    totalWeight, // kg
    isBulkOrder,
    shippingCharge, // Final shipping amount (Base + 18% GST)
    baseShippingCharge, // Base amount for records
    shippingGST, // GST amount for records
    courierName: "Standard Courier",
    estimatedDelivery,
    rateSource: "slab",
    slabInfo: {
      label: slab.label,
      ratePerKg: slab.ratePerKg,
      flatRate: slab.flatRate,
    },
  });
};

const generateShopmozoOrder = async (userData, items, totalWeight, isCOD) => {
  const payload = {
    order_id: `ORD_${uuidv4().slice(0, 8)}_${Date.now()}`,
    order_date: moment().format("YYYY-MM-DD"),
    order_type: "ESSENTIALS",
    consignee_name: userData.full_name || userData.user_name,
    consignee_phone: Number(userData.phone || userData.user_mobile_num),
    consignee_email: userData.email || userData.user_email,
    consignee_address_line_one:
      userData.address_line1 || userData.user_house_number,
    consignee_address_line_two:
      userData.address_line2 || userData.user_landmark || "",
    consignee_pin_code: Number(userData.pincode || userData.user_pincode),
    consignee_city: userData.city || userData.user_city,
    consignee_state: userData.state || userData.user_state,
    product_detail: items.map((item) => ({
      name: item.name || item.product_name,
      sku_number: item.sku || item.product_id || "SKU001",
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
      product_category: "Ghee",
    })),
    payment_type: isCOD ? "COD" : "PREPAID",
    cod_amount: isCOD ? Number(userData.total_amount) : 0,
    weight: totalWeight,
    warehouse_id: process.env.SHOPMOZO_WAREHOUSE_ID || "43190",
  };

  try {
    const response = await axios.post(
      "https://shipping-api.com/app/api/v1/push-order",
      payload,
      {
        headers: {
          "private-key": process.env.SHOPMOZO_PRIVATE_KEY,
          "public-key": process.env.SHOPMOZO_PUBLIC_KEY,
        },
        timeout: 10000,
      },
    );

    if (response.data?.result === "1") {
      const shopmozoOrderId = response.data.data.order_id;
      let awbNumber = null;
      // Auto Assign courier
      try {
        const assignRes = await axios.post(
          "https://shipping-api.com/app/api/v1/auto-assign-order",
          { order_id: shopmozoOrderId },
          {
            headers: {
              "private-key": process.env.SHOPMOZO_PRIVATE_KEY,
              "public-key": process.env.SHOPMOZO_PUBLIC_KEY,
            },
          },
        );
        if (assignRes.data?.result === "1") {
          awbNumber = assignRes.data.data.awb;
        }
      } catch (e) {
        console.error("Auto assign failed:", e.message);
      }
      return { shopmozoOrderId, awbNumber };
    }
  } catch (err) {
    console.error("Shipmozo push error:", err.message);
  }
  return null;
};

// Order Controllers
const placeOrder = async (req, res) => {
  const { user_id, total_amount, shipping_address_id, items, payment_method } =
    req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Create Order
    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, total_amount, shipping_address_id, payment_method, status, payment_status) VALUES (?, ?, ?, ?, 'pending', 'pending')",
      [user_id, total_amount, shipping_address_id, payment_method || "COD"],
    );
    const order_id = orderResult.insertId;

    // 2. Insert Order Items (with weights)
    const itemValues = items.map((item) => {
      let weight = item.weight || null;
      // Ensure numeric weight if possible
      if (typeof weight === "string") {
        const match = weight.match(/([\d.]+)/);
        if (match) weight = parseFloat(match[1]);
      }
      return [
        order_id,
        item.id,
        item.name,
        item.quantity,
        item.price,
        weight,
        item.image || null,
      ];
    });

    await connection.query(
      "INSERT INTO order_items (order_id, product_id, product_name, quantity, price, weight, product_image) VALUES ?",
      [itemValues],
    );

    await connection.commit();
    res
      .status(201)
      .json({ success: true, message: "Order placed successfully", order_id });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

const getMyOrders = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [orders] = await pool.query(
      "SELECT o.*, a.full_name, a.address_line1, a.city, a.country FROM orders o JOIN user_addresses a ON o.shipping_address_id = a.id WHERE o.user_id = ? ORDER BY o.created_at DESC",
      [user_id],
    );

    if (orders.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const orderIds = orders.map((o) => o.id);
    const [items] = await pool.query(
      "SELECT * FROM order_items WHERE order_id IN (?)",
      [orderIds],
    );

    // Group items by order_id
    const ordersWithItems = orders.map((order) => {
      return {
        ...order,
        items: items
          .filter((item) => item.order_id === order.id)
          .map((item) => ({
            ...item,
            image: item.product_image, // Map product_image to image for frontend
          })),
      };
    });

    res.status(200).json({ success: true, orders: ordersWithItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderDetails = async (req, res) => {
  const { order_id } = req.params;
  try {
    const [orderRows] = await pool.query(
      "SELECT o.*, a.* FROM orders o JOIN user_addresses a ON o.shipping_address_id = a.id WHERE o.id = ?",
      [order_id],
    );

    if (orderRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const [items] = await pool.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [order_id],
    );

    res.status(200).json({
      success: true,
      order: orderRows[0],
      items: items.map((item) => ({ ...item, image: item.product_image })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, payment_status } = req.body;
  try {
    let query = "UPDATE orders SET ";
    const params = [];
    const updates = [];

    if (status) {
      const statusMapping = {
        Pending: "pending",
        Shipped: "shipped",
        Delivered: "delivered",
        Cancel: "cancelled",
      };
      const dbStatus = statusMapping[status] || status.toLowerCase();
      updates.push("status = ?");
      params.push(dbStatus);
    }
    if (payment_status) {
      updates.push("payment_status = ?");
      params.push(payment_status);
    }

    if (updates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No updates provided" });
    }

    query += updates.join(", ") + " WHERE id = ?";
    params.push(id);

    await pool.query(query, params);

    // Sync with rajlaksmi_payment table if status is updated
    if (status) {
      try {
        const [[orderRow]] = await pool.query(
          "SELECT shopmozo_order_id FROM orders WHERE id = ?",
          [id],
        );
        if (orderRow && orderRow.shopmozo_order_id) {
          await pool.query(
            "UPDATE rajlaksmi_payment SET status = ? WHERE shopmozo_order_id = ?",
            [status, orderRow.shopmozo_order_id],
          );
        }
      } catch (syncError) {
        console.error("Failed to sync status to rajlaksmi_payment:", syncError);
        // We don't fail the main request if sync fails, but we log it
      }
    }

    res
      .status(200)
      .json({ success: true, message: "Order updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTrackingStatus = async (req, res) => {
  const { order_id } = req.params;
  try {
    const [[order]] = await pool.query(
      "SELECT awb_number, shopmozo_order_id FROM orders WHERE id = ?",
      [order_id],
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const awb = order.awb_number;
    const shopmozoId = order.shopmozo_order_id;

    if (!awb) {
      return res.status(200).json({
        success: true,
        tracking: {
          current_status: shopmozoId ? "Order processing" : "Pending",
          awb_number: null,
        },
      });
    }

    const response = await axios.get(
      `https://shipping-api.com/app/api/v1/track-order?awb_number=${awb}`,
      {
        headers: {
          "private-key": process.env.SHOPMOZO_PRIVATE_KEY,
          "public-key": process.env.SHOPMOZO_PUBLIC_KEY,
        },
        timeout: 10000,
      },
    );

    if (response.data?.result === "1") {
      res.status(200).json({ success: true, tracking: response.data.data });
    } else {
      res.status(200).json({
        success: true,
        tracking: {
          current_status: "Tracking information unavailable",
          awb_number: awb,
        },
      });
    }
  } catch (error) {
    console.error("Tracking error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  saveAddress,
  getAddresses,
  deleteAddress,
  calculateTotalWeight,
  getShippingRates,
  placeOrder,
  getMyOrders,
  getOrderDetails,
  updateOrderStatus,
  getTrackingStatus,
};
