const express = require("express");
const router = express.Router();

const controller = require("../../controllers/users/categoryController");

router.post("/add-category", controller.addCategory);
router.get("/get-category", controller.getAllCategory);
router.get("/get-category/:id", controller.getCategoryById);
router.put("/update-category/:id", controller.updateCategory);
router.delete("/delete-category/:id", controller.deleteCategory);

module.exports = router;
