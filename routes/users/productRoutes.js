const express = require("express");
const router = express.Router();

const { errorHandler } = require("../../middlewares/errorHandler");
const { authMiddleware } = require("../../middlewares/authMiddleware");
const productController = require("../../controllers/users/productController");
const upload = require("../../middlewares/multer");

// Add new product — max 10 images (base64 stored in DB)
router.post(
  "/add-product",
  authMiddleware,
  upload.any(),
  productController.addProduct,
);

// Update product info (no image upload here)
router.put("/update-product/:id", authMiddleware, productController.updateProduct);

// Delete product
router.delete("/delete-product/:id", authMiddleware, productController.deleteProduct);

// Add more images to existing product
router.post(
  "/add-images",
  authMiddleware,
  upload.array("images", 10),
  productController.addProductImages,
);

// Replace a single image at a given index
router.post(
  "/replace-image",
  authMiddleware,
  upload.single("image"),
  productController.replaceProductImage,
);

// Delete a single image at a given index
router.post(
  "/delete-image",
  authMiddleware,
  productController.deleteProductImage,
);

// Replace or add video
router.post(
  "/replace-video",
  authMiddleware,
  upload.single("video"),
  productController.updateProductVideo,
);

// Fetch helpers
router.get("/home-products", productController.getHomeProducts);
router.get("/get_all_products", productController.getAllProducts);
router.get("/category/:category", productController.getProductsByCategory);
router.get("/get-product/:product_id", productController.getProductById);

router.use(errorHandler);

module.exports = router;
