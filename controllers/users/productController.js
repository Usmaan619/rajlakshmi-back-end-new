const productModel = require("../../model/users/productModal");
const { uploadBufferToS3 } = require("../../service/uploadFile");

const sharp = require('sharp');

// ── Helper: Buffer → Compress → base64 data URI ─────────────────────────────
const compressAndConvertToBase64 = async (buffer, mimetype) => {
  try {
    if (mimetype.startsWith('image/')) {
      const compressedBuffer = await sharp(buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      return `data:image/webp;base64,${compressedBuffer.toString("base64")}`;
    }
    return `data:${mimetype};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error("Image compression error:", err);
    return `data:${mimetype};base64,${buffer.toString("base64")}`;
  }
};

// ── Add Product ──────────────────────────────────────────────────────────────
exports.addProduct = async (req, res) => {
  try {
    const data = req.body;

    // if (!req.files || req.files.length < 4) {
    //   return res.status(400).json({ message: "Minimum 4 images required" });
    // }

    // Convert every uploaded file to base64 data URI  ✅ No cloud upload
    const images = await Promise.all(
      req.files
        .filter((file) => file.fieldname === "images")
        .map((file) => compressAndConvertToBase64(file.buffer, file.mimetype))
    );

    data.product_images = images;

    // Handle video upload if present (Base64)
    const videoFile = req.files.find((file) => file.fieldname === "video");
    if (videoFile) {
      data.product_video = await compressAndConvertToBase64(videoFile.buffer, videoFile.mimetype);
    }

    const insertedId = await productModel.addProduct(data);

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      id: insertedId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Get All Products ─────────────────────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
  try {
    const { page, limit, category, search, minPrice, maxPrice, weight } =
      req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const { products, total } = await productModel.getAllProducts({
      page: pageNum,
      limit: limitNum,
      category,
      search,
      minPrice,
      maxPrice,
      weight,
    });

    res.json({
      success: true,
      products,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// ── Get Product by ID ────────────────────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const { product_id } = req.params;
    const products = await productModel.getProductById(product_id);
    if (!products) {
      return res
        .status(404)
        .json({ success: true, message: "Product not found" });
    }
    res.json({ success: true, products });
  } catch (error) {
    console.error("Fetch product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

// ── Update Product ───────────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const isUpdated = await productModel.updateProduct(id, data);

    if (!isUpdated) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Delete Product ───────────────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const isDeleted = await productModel.deleteProduct(id);

    if (!isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Update Product Prices / Weight ───────────────────────────────────────────
exports.updateProductPrices = async (req, res) => {
  try {
    const {
      product_price,
      product_purchase_price,
      product_del_price,
      product_weight,
      product_id,
    } = req.body;

    const isUpdated = await productModel.updateProductPrices(
      product_id,
      product_price,
      product_purchase_price,
      product_del_price,
      product_weight,
    );

    if (!isUpdated) {
      return res
        .status(404)
        .json({ success: true, message: "Product not found" });
    }

    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
};

// ── Add Images to existing product ──────────────────────────────────────────
exports.addProductImages = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Convert new files to base64 data URIs  ✅ No cloud upload
    const newImages = await Promise.all(
      req.files.map((file) => compressAndConvertToBase64(file.buffer, file.mimetype))
    );

    const product = await productModel.getProductById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const oldImages = Array.isArray(product.product_images)
      ? product.product_images
      : [];

    const finalImages = [...oldImages, ...newImages];

    await productModel.updateProductImages(id, JSON.stringify(finalImages));

    res.json({ success: true, images: finalImages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Replace a single product image ──────────────────────────────────────────
exports.replaceProductImage = async (req, res) => {
  try {
    const { id, replace_index } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No replacement file uploaded" });
    }

    if (replace_index === undefined || replace_index === null) {
      return res.status(400).json({ error: "replace_index is required" });
    }

    const product = await productModel.getProductById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const images = Array.isArray(product.product_images)
      ? product.product_images
      : JSON.parse(product.product_images || "[]");

    // Replace at index with new base64 data URI  ✅ No cloud delete needed
    images[replace_index] = await compressAndConvertToBase64(req.file.buffer, req.file.mimetype);

    await productModel.updateProductImages(id, JSON.stringify(images));

    res.json({ success: true, images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Delete a single product image ──────────────────────────────────────────
exports.deleteProductImage = async (req, res) => {
  try {
    const { id, delete_index } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    if (delete_index === undefined || delete_index === null) {
      return res.status(400).json({ error: "delete_index is required" });
    }

    const product = await productModel.getProductById(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const images = Array.isArray(product.product_images)
      ? product.product_images
      : JSON.parse(product.product_images || "[]");

    const idx = parseInt(delete_index, 10);
    if (isNaN(idx) || idx < 0 || idx >= images.length) {
      return res.status(400).json({ error: "Invalid delete_index" });
    }

    // Remove the image at delete_index
    images.splice(idx, 1);

    await productModel.updateProductImages(id, JSON.stringify(images));

    res.json({ success: true, images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Update Product Video ───────────────────────────────────────────────────
exports.updateProductVideo = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Product ID is required" });
    if (!req.file) return res.status(400).json({ error: "Video file is required" });

    const videoBase64 = await compressAndConvertToBase64(req.file.buffer, req.file.mimetype);
    
    // Update ONLY video in model.
    await productModel.updateProductVideo(id, videoBase64);

    res.json({ success: true, video_url: videoBase64 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Home Page Products ───────────────────────────────────────────────────────
exports.getHomeProducts = async (req, res) => {
  try {
    const data = await productModel.getHomePageProducts();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Products by Category ─────────────────────────────────────────────────────
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const data = await productModel.getProductsByCategory(category);
    res.json({ success: true, total: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
