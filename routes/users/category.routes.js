const express = require("express");
const router = express.Router();

const controller = require("../../controllers/users/categoryController");
const upload = require("../../middleware/multer");

router.post("/add-category", upload.single("image"), controller.addCategory);
router.get("/get-category", controller.getAllCategory);
router.get("/get-category/:id", controller.getCategoryById);
router.put(
  "/update-category/:id",
  upload.single("image"),
  controller.updateCategory,
);
router.delete("/delete-category/:id", controller.deleteCategory);

module.exports = router;
