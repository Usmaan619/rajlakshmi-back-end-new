const imagekit = require("../../config/imagekit");
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

    // Get old banner
    const oldBanner = await getBannerSlot(slot);

    // Upload new file to ImageKit
    const newUrl = await uploadBufferToS3(file.buffer, file.mimetype);

    // Delete old image (non-critical — purana Cloudinary URL ho toh skip hoga)
    if (oldBanner) {
      try {
        await deleteFromS3(oldBanner);
      } catch (delErr) {
        console.log("Old banner delete skipped:", delErr.message);
      }
    }

    // Update DB with new ImageKit URL
    await updateBannerSlot(slot, newUrl);

    return res.json({
      updated: true,
      slot,
      newUrl,
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
