const productModel = require("../../model/users/productModal");
const {
  uploadProductImage,
  deleteFromS3,
} = require("../../service/uploadFile");

// Add Product
exports.addProduct = async (req, res) => {
  try {
    const data = req.body;

    if (!req.files || req.files.length < 4) {
      return res.status(400).json({
        message: "Minimum 4 images required",
      });
    }

    const images = [];

    for (const file of req.files) {
      const uploadedUrl = await uploadProductImage(
        file.buffer,
        file.mimetype,
        Date.now(),
      );
      images.push(uploadedUrl);
    }

    data.product_images = images;

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

// Get All Products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await productModel.getAllProducts();
    res.json({ success: true, products });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// Get Product by ID
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

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const isUpdated = await productModel.updateProduct(id, data);

    if (!isUpdated) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const isDeleted = await productModel.deleteProduct(id);

    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

exports.addProductImages = async (req, res) => {
  try {
    const { id } = req.body;

    const uploadPromises = req.files.map((file) =>
      uploadProductImage(file.buffer, file.mimetype, id),
    );

    const newImages = await Promise.all(uploadPromises);

    const product = await productModel.getProductById(id);

    let oldImages = product.product_images
      ? JSON.parse(product.product_images)
      : [];

    const finalImages = [...oldImages, ...newImages];

    await productModel.updateProductImages(id, JSON.stringify(finalImages));

    res.json({
      success: true,
      images: finalImages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.replaceProductImage = async (req, res) => {
  try {
    const { id, replace_index } = req.body;

    const product = await productModel.getProductById(id);

    const images = JSON.parse(product.product_images || "[]");

    const oldImage = images[replace_index];

    const newURL = await uploadProductImage(
      req.file.buffer,
      req.file.mimetype,
      id,
    );

    images[replace_index] = newURL;

    await deleteFromS3(oldImage);

    await productModel.updateProductImages(id, JSON.stringify(images));

    res.json({
      success: true,
      images,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHomeProducts = async (req, res) => {
  try {
    const data = await productModel.getHomePageProducts();

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const data = await productModel.getProductsByCategory(category);

    res.json({
      success: true,
      total: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
