const { pool } = require("../../config/dbConnection");

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
      "INSERT INTO user_addresses (user_id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user_id,
        full_name,
        phone,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
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

// Order Controllers
const placeOrder = async (req, res) => {
  const { user_id, total_amount, shipping_address_id, items, payment_method } =
    req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Create Order
    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, total_amount, shipping_address_id, payment_method) VALUES (?, ?, ?, ?)",
      [user_id, total_amount, shipping_address_id, payment_method],
    );
    const order_id = orderResult.insertId;

    // 2. Insert Order Items
    const itemValues = items.map((item) => [
      order_id,
      item.id,
      item.name,
      item.quantity,
      item.price,
      item.weight || null,
    ]);

    await connection.query(
      "INSERT INTO order_items (order_id, product_id, product_name, quantity, price, weight) VALUES ?",
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
      "SELECT o.*, a.full_name, a.address_line1, a.city FROM orders o JOIN user_addresses a ON o.shipping_address_id = a.id WHERE o.user_id = ? ORDER BY o.created_at DESC",
      [user_id],
    );
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderDetails = async (req, res) => {
  const { order_id } = req.params;
  try {
    const [order] = await pool.query(
      "SELECT o.*, a.* FROM orders o JOIN user_addresses a ON o.shipping_address_id = a.id WHERE o.id = ?",
      [order_id],
    );

    if (order.length === 0) {
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
      order: order[0],
      items,
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
      updates.push("status = ?");
      params.push(status);
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
    res
      .status(200)
      .json({ success: true, message: "Order updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  saveAddress,
  getAddresses,
  deleteAddress,
  placeOrder,
  getMyOrders,
  getOrderDetails,
  updateOrderStatus,
};
