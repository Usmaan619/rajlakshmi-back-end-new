// routes/ussersRoutes.js

const express = require("express");
const router = express.Router();
const cartController = require("../../controllers/users/cartController");
const feedbackController = require("../../controllers/users/feedbackController");
const productController = require("../../controllers/users/productController");
const contactController = require("../../controllers/users/contactController");

const {
  exportTableToExcel,
} = require("../../controllers/users/excelController");
const { errorHandler } = require("../../middlewares/errorHandler");
const {
  createPaymentAndGenerateUrl,
  getPhonePeUrlStatusAndUpdatePayment,
} = require("../../controllers/users/paymentControllers");
const {
  createPaymentAndGenerateUrlRazor,
  getRazorpayStatusAndUpdatePayment,
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

router.get("/getb2bInquiries", getInquiries); // pagination + search + filter

router.get("/getb2bInquiryById/:id", getInquiryById);

router.post("/updateb2bInquiry/:id", updateInquiry);

router.delete("/deleteb2bInquiry/:id", deleteInquiry);

// ** B2B Inquiry end  *//

// phonePe routes
// router.post("/create-order", createPaymentAndGenerateUrl);
// router.post("/status", getPhonePeUrlStatusAndUpdatePayment);

// razorpay
router.post("/create-order", createPaymentAndGenerateUrlRazor);
router.post("/status", getRazorpayStatusAndUpdatePayment);

router.use(errorHandler);

module.exports = router;
