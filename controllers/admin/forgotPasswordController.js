const asyncHandler = require("express-async-handler");
const forgotPasswordModal = require("../../model/admin/forgotPasswordModal");
const bcrypt = require("bcryptjs");

exports.forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const hostname = req.hostname;

  try {
    const user = await forgotPasswordModal.findUserByEmail(email);
    if (!user) {
      return res.json({ success: false, message: "Email not found" });
    }
    //

    const otp = await forgotPasswordModal.sendOTPEmail(user?.email, hostname);

    res.json({ success: true, message: "OTP sent your email successfully." });
  } catch (error) {
    res.json({ message: "Internal server error" });
  }
});

// //   Re-set password
exports.passwordReset = asyncHandler(async (req, res) => {
  const { otp, newPassword } = req.body;

  //validation
  // Validation: Check if newPassword is provided
  if (!newPassword) {
    return res.json({ message: "New password is required" });
  }

  const reset = await forgotPasswordModal.findUserOTP(otp);
  if (!reset) {
    return res.json({ success: false, message: "OTP does not found" });
  }

  try {
    //check otp same or not
    if (reset.otp !== otp) {
      return res.json({ success: false, message: "OTP does not same" });
    }

    // Hash the new password before saving it
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    const msg = await forgotPasswordModal.resetPassword(
      reset?.email,
      otp,
      hashedPassword
    );

    // await user.save();
    res.json({ success: true, message: msg });
  } catch (error) {
    res.json({ message: "Server error" });
  }
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  try {
    const { otp } = req.body;

    const reset = await forgotPasswordModal.findUserOTP(otp);
    if (!reset) {
      return res.json({ success: false, message: "OTP does not found" });
    }

    //check otp same or not
    if (reset.otp !== otp) {
      return res.json({ success: false, message: "OTP does not same" });
    }

    // await user.save();
    res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    res.json({ message: "Server error" });
  }
});
