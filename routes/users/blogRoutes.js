const express = require("express");
const router = express.Router();
const blogController = require("../../controllers/users/blogController");
const upload = require("../../middlewares/multer");
const { errorHandler } = require("../../middlewares/errorHandler");
const { authMiddleware } = require("../../middlewares/authMiddleware");

// Create Blog
router.post(
  "/add-blog",
  authMiddleware,
  upload.single("image"),
  blogController.createBlogController,
);

// Get All Blogs
router.get("/get-all-blogs", blogController.getAllBlogsController);

// Get Blog Categories
router.get("/get-categories", blogController.getBlogCategories);

// Get Single Blog by Slug
router.get("/get-blog/:slug", blogController.getSingleBlogBySlug);

// Get Single Blog by ID
router.get("/get-blog-by-id/:id", blogController.getBlogByIdController);

// Update Blog
router.put(
  "/update-blog/:id",
  authMiddleware,
  upload.single("image"),
  blogController.updateBlogController,
);

// Delete Blog
router.delete("/delete-blog/:id", authMiddleware, blogController.deleteBlogController);

router.use(errorHandler);

module.exports = router;
