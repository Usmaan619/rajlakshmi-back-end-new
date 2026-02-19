// controllers/users/topBannerOfferController.js

const offerModel = require("../../model/users/topBannerModel.js");

// ------------------------------
// GET offers for top banner slider
// ------------------------------
const getOffersController = async (req, res) => {
  try {
    const offers = await offerModel.getOffers();

    if (!offers || offers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No offers found",
      });
    }

    return res.json({
      success: true,
      count: offers.length,
      data: offers,
    });
  } catch (error) {
    console.error("Get offers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch offers",
    });
  }
};

// ------------------------------
// UPDATE offers
// ------------------------------
const updateOffersController = async (req, res) => {
  try {
    const { offer_text1, offer_text2, offer_text3, offer_text4 } = req.body;

    if (!offer_text1 || !offer_text2 || !offer_text3 || !offer_text4) {
      return res.status(400).json({
        success: false,
        message: "All 4 offer texts are required",
      });
    }

    const isUpdated = await offerModel.updateOffers({
      offer_text1,
      offer_text2,
      offer_text3,
      offer_text4,
    });

    if (!isUpdated) {
      return res.status(500).json({
        success: false,
        message: "Failed to update offers",
      });
    }

    return res.json({
      success: true,
      message: "Offers updated successfully",
    });
  } catch (error) {
    console.error("Update offers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update offers",
    });
  }
};

// ------------------------------
// EXPORTS
// ------------------------------
module.exports = {
  getOffersController,
  updateOffersController,
};

// // topBannerOfferController.js
// import offerModel from "../../../model/users/topBannerModel.js";

// // GET offers for slider
// export const getOffersController = async (req, res) => {
//   try {
//     const offers = await offerModel.getOffers();
//     if (!offers || offers.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No offers found",
//       });
//     }
//     res.json({
//       success: true,
//       count: offers.length,
//       data: offers,
//     });
//   } catch (error) {
//     console.error("Get offers error:", error);
//     res.status(500).json({ error: "Failed to fetch offers" });
//   }
// };

// // UPDATE offers
// export const updateOffersController = async (req, res) => {
//   try {
//     const { offer_text1, offer_text2, offer_text3, offer_text4 } = req.body;

//     if (!offer_text1 || !offer_text2 || !offer_text3 || !offer_text4) {
//       return res.status(400).json({
//         success: false,
//         message: "All 4 offer texts are required",
//       });
//     }

//     const isUpdated = await offerModel.updateOffers({
//       offer_text1,
//       offer_text2,
//       offer_text3,
//       offer_text4,
//     });

//     if (!isUpdated) {
//       return res
//         .status(500)
//         .json({ success: false, message: "Failed to update" });
//     }

//     res.json({ success: true, message: "Offers updated successfully" });
//   } catch (error) {
//     console.error("Update offers error:", error);
//     res.status(500).json({ error: "Failed to update offers" });
//   }
// };
