const express = require("express");
const router = express.Router();
const checkoutController = require("../../controllers/users/checkoutController");

// Address Routes
router.post("/address/save", checkoutController.saveAddress);
router.get("/address/:user_id", checkoutController.getAddresses);
router.delete("/address/:id", checkoutController.deleteAddress);

// Order Routes
router.post("/order/place", checkoutController.placeOrder);
router.get("/orders/:user_id", checkoutController.getMyOrders);
router.get("/order/:order_id", checkoutController.getOrderDetails);
router.post("/order/update/:id", checkoutController.updateOrderStatus);

module.exports = router;
