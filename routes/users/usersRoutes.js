// routes/ussersRoutes.js

const express = require("express");
const router = express.Router();
const cartController = require("../../controllers/users/cartController");
const feedbackController = require("../../controllers/users/feedbackController");
const productController = require("../../controllers/users/productController");
const contactController = require("../../controllers/users/contactController");

const { exportTableToExcel } = require("../../controllers/users/excelController");
const { errorHandler } = require("../../middlewares/errorHandler");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const userActivityController = require("../../controllers/users/userActivityController");
const couponController = require("../../controllers/users/couponController");

const {
  createPaymentAndGenerateUrlRazor,
  getRazorpayStatusAndUpdatePayment,
  razorpayWebhook,
} = require("../../controllers/users/razerpayPaymentController");

const {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
} = require("../../controllers/users/b2bInquiryController");

// User Add to cart
router.post("/login/addtocart", cartController.addToCart);

// User Add to cart remove
router.delete("/removecart", cartController.removeFromCart);

// User Update cart item
router.post("/updateCartItem", cartController.updateFromCart);

// User Contact
router.post("/contact", contactController.contact);

// User Add Feedback
router.post("/feedback", feedbackController.feedback);

// Route to fetch all reviews
router.get("/allfeedback", feedbackController.getReviews);

// Route to fetch reviews for specific product
router.get(
  "/productfeedback/:product_id",
  feedbackController.getFeedbackByProduct,
);

// fetch single feedback by Id
router.post("/getSingleFeedbackById/:id", feedbackController.getReviewById);

// fetch single feedback by Id and update
router.put("/UpdateFeedbackById/:id", feedbackController.updateReviewById);

// fetch single feedback by Id and delete
router.delete("/deleteFeedbackById/:id", feedbackController.deleteReviewById);

// get all products
router.get("/getAllProduct", productController.getAllProducts);

// testingCSV
router.get("/getCSV", exportTableToExcel);

// ** B2B Inquiry start  *//

router.post("/createb2bInquiry", createInquiry);

router.get("/getb2bInquiries", authMiddleware, getInquiries); // pagination + search + filter

router.get("/getb2bInquiryById/:id", authMiddleware, getInquiryById);

router.post("/updateb2bInquiry/:id", authMiddleware, updateInquiry);

router.delete("/deleteb2bInquiry/:id", authMiddleware, deleteInquiry);

// ** B2B Inquiry end  *//
// razorpay
router.post("/create-order", createPaymentAndGenerateUrlRazor);
router.post("/status", getRazorpayStatusAndUpdatePayment);
router.post("/webhook/razorpay", razorpayWebhook);

// Cart Routes
router.get("/cart", authMiddleware, userActivityController.getUserCart);
router.post("/cart/add", authMiddleware, userActivityController.addToCart);
router.delete("/cart/remove/:uniqueId", authMiddleware, userActivityController.removeFromCart);
router.delete("/cart/clear", authMiddleware, userActivityController.clearCart);
router.post("/cart/sync", authMiddleware, userActivityController.syncCart);

// Wishlist Routes
router.get("/wishlist", authMiddleware, userActivityController.getUserWishlist);
router.post("/wishlist/toggle", authMiddleware, userActivityController.toggleWishlist);
router.post("/wishlist/sync", authMiddleware, userActivityController.syncWishlist);

// Coupon Route
router.post("/checkout/apply-coupon", authMiddleware, couponController.applyCoupon);

router.use(errorHandler);

module.exports = router;
