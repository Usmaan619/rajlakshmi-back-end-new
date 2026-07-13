const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// FULL PRODUCTION CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,

  // optional, recommended default
  private_cdn: false,
  cname: null,
});

module.exports = cloudinary;
