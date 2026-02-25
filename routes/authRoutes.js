const express = require("express");
const router = express.Router();
const authController = require("../controllers/users/authController");

// User Login Route
router.post("/login", authController.userLogin);

// User Signup Route
router.post("/signup", authController.userSignup);

// Google Login Route
router.post("/google-login", authController.googleLogin);

// Forgot Password Route
router.post("/forgot-password", authController.forgotPassword);

// Reset Password Route
router.post("/reset-password", authController.resetPassword);

module.exports = router;
