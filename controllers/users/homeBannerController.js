const cloudinary = require("../../config/cloudinary");
const {
  getAllBanners,
  getBannerSlot,
  updateBannerSlot,
  ensureHomeBannerRow,
} = require("../../model/users/homeBannerModel");

const { uploadBufferToS3, deleteFromS3 } = require("../../service/uploadFile");

// const cloudinary = require("");

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

    // Upload new file
    const newUrl = await uploadBufferToS3(file.buffer, file.mimetype);

    // Delete old S3 file
    if (oldBanner) {
      await deleteFromS3(oldBanner);
    }

    // Update DB
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

exports.getSignature = async (req, res) => {
  const { folder, timestamp } = req.body;

  const signature = cloudinary.utils.api_sign_request(
    {
      folder,
      timestamp: parseInt(timestamp),
    },
    process.env.CLOUDINARY_API_SECRET,
  );

  res.json({
    signature,
    timestamp,
    folder,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
  });
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
