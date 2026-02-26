const asyncHandler = require("express-async-handler");
const userModel = require("../../model/users/userModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID ||
    "725826907762-oqshpfbtciv5n0coch74f91qurujp8r5.apps.googleusercontent.com",
);

// Google Login Feature
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

    let user = await userModel.findUserByEmail(payload.email);

    if (!user) {
      await userModel.userRegister({
        full_name: payload.name || "Google User",
        email: payload.email,
        mobile_number: "",
        password: "",
        profile_image: payload.picture,
        role: "user",
        permissions: null,
      });
      user = await userModel.findUserByEmail(payload.email);
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
      token: jwtToken,
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
    console.error("Google Login Error:", error);
    return res.json({ success: false, message: "Invalid Google token." });
  }
});

// Facebook Login Feature
exports.facebookLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.json({ success: false, message: "Token is required." });
  }

  try {
    const facebookRes = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
    );

    const { name, email, picture } = facebookRes.data;

    if (!email) {
      return res.json({
        success: false,
        message: "Your Facebook account must have an email associated with it.",
      });
    }

    let user = await userModel.findUserByEmail(email);

    if (!user) {
      await userModel.userRegister({
        full_name: name || "Facebook User",
        email: email,
        mobile_number: "",
        password: "",
        profile_image: picture?.data?.url || "",
        role: "user",
        permissions: null,
      });
      user = await userModel.findUserByEmail(email);
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
      token: jwtToken,
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
    console.error("Facebook Login Error:", error);
    return res.json({ success: false, message: "Invalid Facebook token." });
  }
});
