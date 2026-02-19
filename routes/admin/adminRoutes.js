const express = require("express");
const router = express.Router();

// Middleware
const { errorHandler } = require("../../middlewares/errorHandler");
const { authMiddleware } = require("../../middlewares/authMiddleware");

// Controllers
// Admin
const registerController = require("../../controllers/admin/registerController");
const loginController = require("../../controllers/admin/loginController");
const forgotPasswordController = require("../../controllers/admin/forgotPasswordController");
const userInfoController = require("../../controllers/admin/userInfoController");
const monthlyReportController = require("../../controllers/admin/monthlyReportController");

// Gauswarn
const productControllerGauswarn = require("../../controllers/users/productController");
const feedbackGauswarnController = require("../../controllers/users/feedbackController");
const contactControllerGauswarn = require("../../controllers/users/contactController");
const imageUploadControllerGauswarn = require("../../controllers/users/uploadController");

const homeBannerControllerGauswarn = require("../../controllers/users/homeBannerController");

const reelControllerGauswarn = require("../../controllers/users/reelController");

const blogsControllerGauswarn = require("../../controllers/users/blogController");

const upload = require("../../middlewares/multer");
const {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
} = require("../../controllers/users/b2bInquiryController");

const newsletterController = require("../../controllers/users/newsletterController");

const topBannerOfferController = require("../../controllers/users/topBannerOfferController");

// ----------------------------
// Admin Routes
// ----------------------------
router.post("/register", registerController.adminUserRegister);
router.post("/login", loginController.adminUserLogin);

router.post("/forgetPassword", forgotPasswordController.forgetPassword);
router.post("/reset", forgotPasswordController.passwordReset);
router.post("/verifyOtp", forgotPasswordController.verifyOtp);

router.get(
  "/getAllGauswarnUsers",
  authMiddleware,
  registerController.getAllGauswarnUsers,
);

// update user
router.post("/updateUser/:id", registerController.updateUser);

// delete user
router.delete("/deleteUser/:id", registerController.deleteUser);

// router.get("/me", authMiddleware, registerController.meAPI);
router.get(
  "/getAllCustomer",
  authMiddleware,
  userInfoController.getAllUserInfo,
);
router.get(
  "/getAllOrderDetails",
  authMiddleware,
  userInfoController.getAllOrderDetails,
);
router.post(
  "/updateOrderStatus/:id",
  authMiddleware,
  userInfoController.updateOrderStatus,
);

router.post(
  "/getAllSales",
  authMiddleware,
  monthlyReportController.getAllSales,
);

// ----------------------------
// Gauswarn Routes
// ----------------------------
// Products
router.post("/createProductGauswarn", productControllerGauswarn.addProduct);
router.post(
  "/updateGauswarnProductById",
  productControllerGauswarn.updateProductPrices,
);
router.post(
  "/deleteGauswarnProductById",
  productControllerGauswarn.deleteProduct,
);
router.get("/gauswarnGetAllProduct", productControllerGauswarn.getAllProducts);

// Feedback (auth-protected)
router.get(
  "/allfeedback",
  authMiddleware,
  feedbackGauswarnController.getReviews,
);
router.post(
  "/createFeedback",
  authMiddleware,
  feedbackGauswarnController.feedback,
);
router.post(
  "/getSingleFeedbackById/:id",
  authMiddleware,
  feedbackGauswarnController.getReviewById,
);
router.put(
  "/updateFeedbackById/:id",
  authMiddleware,
  feedbackGauswarnController.updateReviewById,
);
router.delete(
  "/deleteFeedbackById/:id",
  authMiddleware,
  feedbackGauswarnController.deleteReviewById,
);

// Image and Video upload
// router.post("/imageUpload", imageUploadControllerGauswarn.imageAndVideoUpload);

// BASE64
router.post("/base64", imageUploadControllerGauswarn.uploadMedia);

// Single file
router.post(
  "/imageUpload",
  upload.single("file"),
  imageUploadControllerGauswarn.uploadMedia,
);

// Multiple file
router.post(
  "/files",
  upload.array("files"),
  imageUploadControllerGauswarn.uploadMedia,
);

router.post(
  "/add-images",
  upload.array("images", 10),
  productControllerGauswarn.addProductImages,
);

router.post(
  "/replace-image",
  upload.single("image"),
  productControllerGauswarn.replaceProductImage,
);

router.post("/banner-signature", homeBannerControllerGauswarn.getSignature);

// GET all 4 banners
router.get("/home-banners", homeBannerControllerGauswarn.getHomeBanners);

router.post(
  "/home-banners-url",
  homeBannerControllerGauswarn.updateHomeBannerByUrl,
);

// POST all 4 banners
router.post(
  "/home-banners-images",
  upload.single("banner"),
  homeBannerControllerGauswarn.updateHomeBanner,
);
// upload reels
router.post("/reels", reelControllerGauswarn.createReel); // add
router.get("/reels/all", reelControllerGauswarn.listReels); // list
router.delete("/reels-delete/:id", reelControllerGauswarn.deleteReelById); // delete

// blogs routes
// CREATE BLOG
router.post(
  "/blogs/create",
  upload.single("image"),
  (req, res, next) => {
    console.log("DEBUG BODYssssssssssssss:", req.body);
    console.log("DEBUG FILE:", req.file);
    next();
  },
  blogsControllerGauswarn.createBlogController,
);
// UPDATE BLOG
router.post(
  "/blogs/update/:id",
  upload.single("image"),
  blogsControllerGauswarn.updateBlogController,
);

// GET ALL
router.get("/blogs", blogsControllerGauswarn.getAllBlogsController);

// GET BY SLUG
router.get("/blogs/single/:slug", blogsControllerGauswarn.getSingleBlogBySlug);

router.get("/blogs/:id", blogsControllerGauswarn.getBlogByIdController);

// DELETE
router.delete("/blogs/:id", blogsControllerGauswarn.deleteBlogController);

// ** B2B Inquiry start  *//

router.post("/createb2bInquiry", createInquiry);

router.get("/getb2bInquiries", getInquiries); // pagination + search + filter

router.get("/getb2bInquiryById/:id", getInquiryById);

router.post("/updateb2bInquiry/:id", updateInquiry);

router.delete("/deleteb2bInquiry/:id", deleteInquiry);

// ** B2B Inquiry end  *//

//Newsletter Routes

router.get("/getNewsletter", newsletterController.getNewsletter);
router.post("/createNewsletter", newsletterController.createNewsletter);
router.post(
  "/updateNewsletterStatus/:id",
  newsletterController.updateNewsletterStatus,
);
router.delete("/deleteNewsletter/:id", newsletterController.deleteNewsletter);

// End Newsletter Routes

router.get("/getAllOffer", topBannerOfferController.getOffersController);
router.post("/updateOffer", topBannerOfferController.updateOffersController);

// Contact (auth-protected)
router.get(
  "/getAllContact",
  authMiddleware,
  contactControllerGauswarn.getAllContact,
);

// ----------------------------
// Global Error Handler
// ----------------------------
router.use(errorHandler);

module.exports = router;
