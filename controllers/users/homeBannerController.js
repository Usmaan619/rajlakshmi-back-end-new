const imagekit = require("../../config/imagekit");
const sharp = require("sharp");
const {
  getAllBanners,
  getBannerSlot,
  updateBannerSlot,
  ensureHomeBannerRow,
} = require("../../model/users/homeBannerModel");

const { uploadBufferToS3, deleteFromS3 } = require("../../service/uploadFile");

// GET all banners
exports.getHomeBanners = async (req, res) => {
  try {
    await ensureHomeBannerRow();
    const banners = await getAllBanners();
    return res.json(banners);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateHomeBanner = async (req, res) => {
  try {
    const slot = Number(req.body.slots); // convert to number
    const file = req.file;

    await ensureHomeBannerRow();
    if (!slot) {
      return res.status(400).json({ message: "Slot is required" });
    }

    if (![1, 2, 3, 4].includes(slot)) {
      return res.status(400).json({ message: "Invalid slot number" });
    }

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Convert file buffer to WebP buffer
    const webpBuffer = await sharp(file.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    // Convert WebP buffer to Base64 string
    const base64String = "data:image/webp;base64," + webpBuffer.toString("base64");

    // Get old banner
    const oldBanner = await getBannerSlot(slot);

    // Delete old image from S3 if it was stored there
    if (oldBanner && (oldBanner.includes("http") || oldBanner.includes("https"))) {
      try {
        await deleteFromS3(oldBanner);
      } catch (delErr) {
        console.log("Old banner delete skipped:", delErr.message);
      }
    }

    // Update DB with new Base64 URL
    await updateBannerSlot(slot, base64String);

    return res.json({
      updated: true,
      slot,
      newUrl: base64String,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ImageKit auth token for frontend direct uploads
exports.getSignature = async (req, res) => {
  try {
    const authParams = imagekit.helper.getAuthenticationParameters();
    res.json({
      token: authParams.token,
      expire: authParams.expire,
      signature: authParams.signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// In homeBannerController.js - add this NEW endpoint
exports.updateHomeBannerByUrl = async (req, res) => {
  try {
    const { slot, url } = req.body;

    if (!slot || !url) {
      return res.status(400).json({ message: "Slot and URL required" });
    }

    if (![1, 2, 3, 4].includes(Number(slot))) {
      return res.status(400).json({ message: "Invalid slot" });
    }

    await ensureHomeBannerRow();

    // Get old banner and delete from S3
    const oldBanner = await getBannerSlot(slot);
    if (oldBanner) {
      await deleteFromS3(oldBanner);
    }

    // Update DB with new URL
    await updateBannerSlot(slot, url);

    return res.json({ updated: true, slot, newUrl: url });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
