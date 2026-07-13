const asyncHandler = require("express-async-handler");
const registerModel = require("../../model/admin/registerModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID ||
    "725826907762-oqshpfbtciv5n0coch74f91qurujp8r5.apps.googleusercontent.com",
);

exports.adminUserLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      message: "Please provide both email and password.",
    });
  }

  try {
    const user = await registerModel.findAdminUserByEmail(email);

    if (!user) {
      return res.json({
        message: "Email does not exist.",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.json({
        message: "Invalid password.",
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, userName: user.full_name },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );
    console.log("user: ", user);

    return res.json({
      success: true,
      message: "Login successful.",
      email: user?.email,
      name: user?.full_name,
      role: user?.role,
      permissions: user?.permissions ? JSON.parse(user.permissions) : [], // ← ADD THIS
      accessToken: token,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

exports.googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.json({ success: false, message: "Token is required." });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience:
        process.env.GOOGLE_CLIENT_ID ||
        "725826907762-oqshpfbtciv5n0coch74f91qurujp8r5.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.json({
        success: false,
        message: "Invalid Google token payload.",
      });
    }

    let user = await registerModel.findAdminUserByEmail(payload.email);

    if (!user) {
      // Register user automatically
      await registerModel.adminUserRegister({
        full_name: payload.name || "Google User",
        email: payload.email,
        mobile_number: "",
        password: "",
        role: "user",
        permissions: null,
      });
      user = await registerModel.findAdminUserByEmail(payload.email);
    }

    if (!user) {
      return res.json({ success: false, message: "Failed to create user." });
    }

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, userName: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.json({
      success: true,
      message: "Login successful.",
      email: user.email,
      name: user.full_name,
      role: user.role,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      accessToken: jwtToken,
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res.json({ success: false, message: "Invalid Google token." });
  }
});
