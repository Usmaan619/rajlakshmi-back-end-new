const asyncHandler = require("express-async-handler");
const userModel = require("../../model/users/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
// Removed social login imports (axios, google-auth-library)

// Normal Email/Password Login
exports.userLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "Please provide both email and password.",
    });
  }

  try {
    let user = await userModel.findUserByEmail(email);

    if (!user) {
      // Auto-Signup (mimic Google behavior)
      const hashedPassword = await bcrypt.hash(password, 10);
      const name = email.split("@")[0];

      const result = await userModel.userRegister({
        full_name: name,
        email: email,
        mobile_number: "",
        password: hashedPassword,
        profile_image: "",
        role: "user",
        permissions: null,
      });

      if (!result) {
        return res.json({
          success: false,
          message: "Registration failed during login. Please try again.",
        });
      }

      user = await userModel.findUserByEmail(email);
    } else {
      // Check if user has a password (might be google only)
      if (!(user.password || user.PASSWORD)) {
        return res.json({
          success: false,
          message: "Please login with Google.",
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password || user.PASSWORD,
      );

      if (!isValidPassword) {
        return res.json({
          success: false,
          message: "Invalid password.",
        });
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, userName: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        full_name: user.full_name,
        profile_image: user.profile_image,
        role: user.role,
        mobile_number: user.mobile_number,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
      },
    });
  } catch (error) {
    console.log("userLogin error: ", error);
    return res.json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

// Social Logins moved to socialAuthController.js

// Normal user signup
exports.userSignup = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!email || !password || !name) {
    return res.json({
      success: false,
      message: "Please provide name, email, and password.",
    });
  }

  try {
    let user = await userModel.findUserByEmail(email);

    if (user) {
      // Auto-Login (mimic Google behavior)
      if (!(user.password || user.PASSWORD)) {
        return res.json({
          success: false,
          message: "Please login with Google.",
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password || user.PASSWORD,
      );

      if (!isValidPassword) {
        return res.json({
          success: false,
          message: "Invalid password for existing account.",
        });
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await userModel.userRegister({
        full_name: name,
        email: email,
        mobile_number: phone || "",
        password: hashedPassword,
        profile_image: "",
        role: "user",
        permissions: null,
      });

      if (!result) {
        return res.json({
          success: false,
          message: "Registration failed. Please try again.",
        });
      }

      user = await userModel.findUserByEmail(email);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, userName: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.json({
      success: true,
      message: "Registration successful.",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        full_name: user.full_name,
        profile_image: user.profile_image,
        role: user.role,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
      },
    });
  } catch (error) {
    console.log("userSignup error: ", error);
    return res.json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

// Forgot Password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const hostname = req.hostname;

  try {
    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.json({ success: false, message: "Email not found" });
    }

    const otp = await userModel.sendOTPEmail(user?.email, hostname);

    res.json({
      success: true,
      message: "OTP sent to your email successfully.",
    });
  } catch (error) {
    res.json({ success: false, message: "Internal server error" });
  }
});

// Reset Password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { otp, newPassword } = req.body;

  if (!newPassword || !otp) {
    return res.json({
      success: false,
      message: "OTP and new password are required",
    });
  }

  const reset = await userModel.findUserOTP(otp);
  if (!reset) {
    return res.json({ success: false, message: "OTP not found or expired" });
  }

  try {
    if (reset.otp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    // Hash the new password before saving it
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const msg = await userModel.resetPassword(
      reset?.email,
      otp,
      hashedPassword,
    );

    res.json({
      success: true,
      message: msg ? msg.message : "Password reset successfully",
    });
  } catch (error) {
    res.json({ success: false, message: "Server error" });
  }
});

// Update User Profile
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { full_name, mobile_number, profile_image } = req.body;

  try {
    const success = await userModel.updateUser(userId, {
      full_name,
      mobile_number,
      profile_image,
    });

    if (success) {
      const updatedUser = await userModel.findUserByEmail(req.user.email);
      res.json({
        success: true,
        message: "Profile updated successfully.",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.full_name,
          full_name: updatedUser.full_name, // for consistency
          profile_image: updatedUser.profile_image,
          mobile_number: updatedUser.mobile_number,
          role: updatedUser.role,
        },
      });
    } else {
      res.json({ success: false, message: "Failed to update profile." });
    }
  } catch (error) {
    console.error("updateUserProfile error: ", error);
    res.json({ success: false, message: "Server error" });
  }
});
