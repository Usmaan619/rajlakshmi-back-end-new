const couponModel = require("../../model/coupons/couponModel");

exports.createCoupon = async (req, res) => {
  const {
    code,
    discount_type,
    discount_value,
    min_order_value,
    max_discount,
    usage_limit,
    expiry_date,
  } = req.body;

  if (
    !code ||
    !discount_type ||
    discount_value === undefined ||
    usage_limit === undefined ||
    !expiry_date
  ) {
    return res.status(400).json({
      success: false,
      message: "Required fields: code, discount_type, discount_value, usage_limit, expiry_date.",
    });
  }

  try {
    const existing = await couponModel.findCouponByCode(code.toUpperCase());
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A coupon with this code already exists.",
      });
    }

    const result = await couponModel.createCoupon(req.body);
    return res.status(201).json({
      success: true,
      message: "Coupon created successfully.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Create coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.listAllCoupons = async (req, res) => {
  try {
    const coupons = await couponModel.getAllCoupons();
    return res.status(200).json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error("List coupons error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.updateCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await couponModel.updateCoupon(id, req.body);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully.",
    });
  } catch (error) {
    console.error("Update coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.deleteCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await couponModel.deleteCoupon(id);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully.",
    });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
