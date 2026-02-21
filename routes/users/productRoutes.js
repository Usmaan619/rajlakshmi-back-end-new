const express = require("express");
const router = express.Router();

// Middleware
const { errorHandler } = require("../../middlewares/errorHandler");
const productController = require("../../controllers/users/productController");
const upload = require("../../middlewares/multer");

router.post(
  "/add-product",
  upload.array("images", 5),
  productController.addProduct,
);
router.put("/update-product/:id", productController.updateProduct);
router.delete("/delete-product/:id", productController.deleteProduct);
router.get("/home-products", productController.getHomeProducts);
router.get("/get_all_products", productController.getAllProducts);

router.get(
  "/products/category/:category",
  productController.getProductsByCategory,
);

router.use(errorHandler);

module.exports = router;
