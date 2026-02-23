const express = require("express");
const router = express.Router();

const { errorHandler } = require("../../middlewares/errorHandler");
const productController = require("../../controllers/users/productController");
const upload = require("../../middlewares/multer");

// Add new product — max 10 images (base64 stored in DB)
router.post(
  "/add-product",
  upload.array("images", 10),
  productController.addProduct,
);

// Update product info (no image upload here)
router.put("/update-product/:id", productController.updateProduct);

// Delete product
router.delete("/delete-product/:id", productController.deleteProduct);

// Add more images to existing product
router.post(
  "/add-images",
  upload.array("images", 10),
  productController.addProductImages,
);

// Replace a single image at a given index
router.post(
  "/replace-image",
  upload.single("image"),
  productController.replaceProductImage,
);

// Fetch helpers
router.get("/home-products", productController.getHomeProducts);
router.get("/get_all_products", productController.getAllProducts);
router.get(
  "/products/category/:category",
  productController.getProductsByCategory,
);

router.use(errorHandler);

module.exports = router;
