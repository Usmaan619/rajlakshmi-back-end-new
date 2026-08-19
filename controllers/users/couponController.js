const couponModel = require("../../model/coupons/couponModel");

exports.applyCoupon = async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code || !cartTotal) {
    return res.status(400).json({
      success: false,
      message: "Please provide coupon code and cart total.",
    });
  }

  try {
    const coupon = await couponModel.findCouponByCode(code.toUpperCase());

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive coupon code.",
      });
    }

    // Check expiry
    const now = new Date();
    const expiry = new Date(coupon.expiry_date);
    if (now > expiry) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired.",
      });
    }

    // Check usage limit
    if (coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached.",
      });
    }

    // Check min order value
    if (cartTotal < coupon.min_order_value) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value for this coupon is ₹${coupon.min_order_value}.`,
      });
    }

    let discount = 0;
    if (coupon.discount_type === "percent") {
      discount = (cartTotal * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else if (coupon.discount_type === "flat") {
      discount = coupon.discount_value;
    }

    // Ensure discount leaves at least ₹1 for the payment gateway minimum
    if (discount >= cartTotal) {
      discount = cartTotal - 1;
    }

    const finalPrice = cartTotal - discount;

    return res.status(200).json({
      success: true,
      discount,
      finalPrice,
      message: "Coupon applied successfully!",
    });
  } catch (error) {
    console.error("Apply coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
