const {
  createBlog,
  getAllBlogs,
  getBlogCount,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
} = require("../../model/users/blogModel");

const {
  uploadBufferAndBlogsToS3,
  deleteFromS3,
} = require("../../service/uploadFile");

// ✅ Slug generator
const makeSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// ============================
// CREATE BLOG
// ============================
exports.createBlogController = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title & content required",
      });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadBufferAndBlogsToS3(
        req.file.buffer,
        req.file.mimetype,
        "blogs"
      );
    }

    const slug = makeSlug(title);
    const id = await createBlog({
      title,
      slug,
      content,
      category: category || "",
      image_url: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      id,
      slug,
    });
  } catch (err) {
    console.error("Create blog error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================
// GET ALL BLOGS (PRODUCTION READY)
// ============================
exports.getAllBlogsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort === "old" ? "ASC" : "DESC";

    const blogs = await getAllBlogs(page, limit, sort);
    const total = await getBlogCount();
    
    // ✅ Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error("Get all blogs error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ============================
// GET SINGLE BY SLUG
// ============================
exports.getSingleBlogBySlug = async (req, res) => {
  try {
    const blog = await getBlogBySlug(req.params.slug);
    if (!blog) {
      return res.status(404).json({ 
        success: false,
        message: "Blog not found" 
      });
    }
    res.json({ success: true, blog });
  } catch (err) {
    console.error("Get blog by slug error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================
// GET BY ID
// ============================
exports.getBlogByIdController = async (req, res) => {
  try {
    const id = req.params.id;
    const blog = await getBlogById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.json({
      success: true,
      blog,
    });
  } catch (err) {
    console.error("Get Blog By ID Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ============================
// UPDATE BLOG
// ============================
exports.updateBlogController = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const id = req.params.id;

    const oldBlog = await getBlogById(id);
    if (!oldBlog) {
      return res.status(404).json({ 
        success: false,
        message: "Blog not found" 
      });
    }

    let imageUrl = oldBlog.image_url;
    if (req.file) {
      if (oldBlog.image_url) {
        await deleteFromS3(oldBlog.image_url);
      }
      imageUrl = await uploadBufferAndBlogsToS3(
        req.file.buffer,
        req.file.mimetype,
        "blogs"
      );
    }

    const slug = makeSlug(title);
    await updateBlog(id, {
      title,
      slug,
      content,
      category: category || "",
      image_url: imageUrl,
    });

    res.json({
      success: true,
      message: "Blog updated successfully",
      slug,
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================
// DELETE BLOG
// ============================
exports.deleteBlogController = async (req, res) => {
  try {
    const id = req.params.id;
    const blog = await getBlogById(id);

    if (!blog) {
      return res.status(404).json({ 
        success: false,
        message: "Blog not found" 
      });
    }

    if (blog.image_url) {
      await deleteFromS3(blog.image_url);
    }

    await deleteBlog(id);
    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// const {
//   createBlog,
//   getAllBlogs,
//   getBlogCount,
//   getBlogById,
//   getBlogBySlug,
//   updateBlog,
//   deleteBlog,
// } = require("../../../model/users/blogModel");

// const {
//   uploadBufferAndBlogsToS3,
//   deleteFromS3,
// } = require("../../service/uploadFile");

// // slug generator
// const makeSlug = (title) =>
//   title
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/(^-|-$)+/g, "");

// // ============================
// // CREATE BLOG
// // ============================
// exports.createBlogController = async (req, res) => {
//   console.log("BODY:", req.body);
//   console.log("FILE:", req.file);

//   try {
//     const { title, content, category } = req.body;

//     if (!title || !content) {
//       return res.status(400).json({
//         success: false,
//         message: "Title & content required",
//       });
//     }

//     let imageUrl = null;

//     if (req.file) {
//       imageUrl = await uploadBufferAndBlogsToS3(
//         req.file.buffer,
//         req.file.mimetype,
//         "blogs"
//       );
//     }

//     const slug = makeSlug(title);

//     const id = await createBlog({
//       title,
//       slug,
//       content,
//       category: category || "",
//       image_url: imageUrl,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Blog created successfully",
//       id,
//       slug,
//     });
//   } catch (err) {
//     console.error("Create blog error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// // ============================
// // UPDATE BLOG
// // ============================
// exports.updateBlogController = async (req, res) => {
//   console.log("UPDATE BODY:", req.body);
//   console.log("UPDATE FILE:", req.file);

//   try {
//     const { title, content, category } = req.body;
//     const id = req.params.id;

//     const old = await getBlogById(id);

//     if (!old) return res.status(404).json({ message: "Blog not found" });

//     let imageUrl = old.image_url;

//     if (req.file) {
//       if (old.image_url) await deleteFromS3(old.image_url);

//       imageUrl = await uploadBufferAndBlogsToS3(
//         req.file.buffer,
//         req.file.mimetype,
//         "blogs"
//       );
//     }

//     const slug = makeSlug(title);

//     await updateBlog(id, {
//       title,
//       slug,
//       content,
//       category,
//       image_url: imageUrl,
//     });

//     res.json({
//       success: true,
//       message: "Blog updated successfully",
//       slug,
//     });
//   } catch (err) {
//     console.error("Update error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// // ============================
// // GET ALL BLOGS
// // ============================
// // ============================
// // GET ALL BLOGS
// // ============================
// // exports.getAllBlogsController = async (req, res) => {
// //   try {
// //     const page = parseInt(req.query.page) || 1; // default 1
// //     const limit = parseInt(req.query.limit) || 10; // default 10

// //     const blogs = await getAllBlogs(page, limit);

// //     res.json({
// //       success: true,
// //       blogs,
// //       page,
// //       limit,
// //     });
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // };

// exports.getAllBlogsController = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     //  SORT PARAM (default = newest)
//     const sort = req.query.sort === "old" ? "ASC" : "DESC";

//     const blogs = await getAllBlogs(page, limit, sort);

//     res.json({
//       success: true,
//       blogs,
//       page,
//       limit,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// // ============================
// // GET SINGLE BY SLUG
// // ============================
// exports.getSingleBlogBySlug = async (req, res) => {
//   try {
//     const blog = await getBlogBySlug(req.params.slug);
//     if (!blog) return res.status(404).json({ message: "Blog not found" });

//     res.json({ success: true, blog });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ============================
// // DELETE BLOG
// // ============================
// exports.deleteBlogController = async (req, res) => {
//   try {
//     const id = req.params.id;

//     const blog = await getBlogById(id);
//     if (!blog) return res.status(404).json({ message: "Blog not found" });

//     if (blog.image_url) await deleteFromS3(blog.image_url);

//     await deleteBlog(id);

//     res.json({ success: true, message: "Blog deleted" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getBlogByIdController = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const blog = await getBlogById(id);

//     if (!blog) {
//       return res.status(404).json({
//         success: false,
//         message: "Blog not found",
//       });
//     }

//     res.json({
//       success: true,
//       blog,
//     });
//   } catch (err) {
//     console.error("Get Blog By ID Error:", err);
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
