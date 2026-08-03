const express = require("express");
const router = express.Router();
const checkoutController = require("../../controllers/users/checkoutController");
const { authMiddleware } = require("../../middlewares/authMiddleware");

// Address Routes
router.post("/address/save", authMiddleware, checkoutController.saveAddress);
router.get("/address/:user_id", authMiddleware, checkoutController.getAddresses);
router.delete("/address/:id", authMiddleware, checkoutController.deleteAddress);

// Order Routes
router.post("/order/place", authMiddleware, checkoutController.placeOrder);
router.get("/orders/:user_id", authMiddleware, checkoutController.getMyOrders);
router.get("/order/:order_id", authMiddleware, checkoutController.getOrderDetails);
router.post("/order/update/:id", authMiddleware, checkoutController.updateOrderStatus);
router.post("/get-shipping", authMiddleware, checkoutController.getShippingRates);
router.get("/track/:order_id", authMiddleware, checkoutController.getTrackingStatus);

module.exports = router;
