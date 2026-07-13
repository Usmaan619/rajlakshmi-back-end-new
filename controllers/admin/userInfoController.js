// Get All Products

const adminUserInfoModal = require("../../model/admin/userInfoModal");
const userModel = require("../../model/users/userModel");
const asyncHandler = require("express-async-handler");

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
