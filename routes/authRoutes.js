const express = require("express");
const router = express.Router();
const authController = require("../controllers/users/authController");
const socialAuthController = require("../controllers/users/socialAuthController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { loginRateLimiter } = require("../middlewares/rateLimiter");

// User Login Route
router.post("/login", loginRateLimiter, authController.userLogin);

// User Signup Route
router.post("/signup", authController.userSignup);

// Google Login Route
router.post("/google-login", loginRateLimiter, socialAuthController.googleLogin);

// Facebook Login Route
router.post("/facebook-login", socialAuthController.facebookLogin);

// Forgot Password Route
router.post("/forgot-password", authController.forgotPassword);

// Reset Password Route
router.post("/reset-password", authController.resetPassword);

// Update Profile Route
router.put("/update-profile", authMiddleware, authController.updateUserProfile);

module.exports = router;
