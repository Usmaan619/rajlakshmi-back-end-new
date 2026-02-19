const productModel = require("../../model/users/productModal");
const {
  uploadProductImage,
  deleteFromS3,
} = require("../../service/uploadFile");

// Add Product
exports.addProduct = async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      product_price,
      product_weight,
      product_purchase_price,
      product_del_price,
      product_images,
    } = req.body;

    if (
      !product_id ||
      !product_name ||
      !product_price ||
      !product_weight ||
      !product_purchase_price ||
      !product_del_price ||
      !product_images
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const insertedId = await productModel.addProduct(
      product_id,
      product_name,
      product_price,
      product_weight,
      product_purchase_price,
      product_del_price,
      product_images,
    );

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      insertedId,
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ error: "Failed to add product" });
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
    const {
      product_id,
      product_name,
      product_price,
      product_weight,
      product_purchase_price,
      product_del_price,
    } = req.body;

    const isUpdated = await productModel.updateProduct(
      product_id,
      product_name,
      product_price,
      product_weight,
      product_purchase_price,
      product_del_price,
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

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const isDeleted = await productModel.deleteProduct(id);
    if (!isDeleted) {
      return res
        .status(404)
        .json({ success: true, message: "Product not found" });
    }
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete product" });
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

exports.addProductNew = async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      product_price,
      product_weight,
      product_purchase_price,
      product_del_price,
    } = req.body;

    if (!req.files || req.files.length < 4) {
      return res.status(400).json({ message: "Minimum 4 images required" });
    }

    const images = [];

    for (const file of req.files) {
      const uploadedUrl = await uploadProductImage(
        file.buffer,
        file.mimetype,
        product_id,
      );
      images.push(uploadedUrl);
    }

    const insertedId = await productModel.addProduct(
      product_id,
      product_name,
      product_price,
      product_weight,
      product_purchase_price,
      product_del_price,
      JSON.stringify(images),
    );

    res.json({
      success: true,
      message: "Product added",
      product_id,
      images,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// UPDATE PRODUCT IMAGE (replace single image by index)
exports.updateProductNew = async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      product_price,
      product_weight,
      product_purchase_price,
      product_del_price,
      replace_index,
    } = req.body;

    const product = await productModel.getProductByProductId(product_id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let images = JSON.parse(product.product_images);

    if (req.file) {
      const newUrl = await uploadProductImage(
        req.file.buffer,
        req.file.mimetype,
        product_id,
      );

      images[replace_index] = newUrl; // replace only this image
    }

    await productModel.updateProduct(
      product_name,
      product_price,
      product_weight,
      product_purchase_price,
      product_del_price,
      JSON.stringify(images),
      product_id,
    );

    res.json({
      success: true,
      message: "Product updated",
      images,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// ------------------------------------------------------------------

// Add Images
// exports.addProductImages = async (req, res) => {
//   try {
//     const { product_id } = req.body;

//     if (!product_id) {
//       return res.status(400).json({ message: "Product ID required" });
//     }

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: "At least 1 image required" });
//     }

//     // Multiple uploads parallel me
//     const uploadPromises = req.files.map((file) =>
//       uploadProductImage(file.buffer, file.mimetype, product_id)
//     );

//     const images = await Promise.all(uploadPromises);

//     await productModel.updateProductImages(product_id, JSON.stringify(images));

//     res.json({
//       success: true,
//       message: "Images uploaded",
//       images,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: "Upload failed" });
//   }
// };

exports.addProductImages = async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: "Product ID required" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least 1 image required" });
    }

    // 1) Upload NEW IMAGES parallelly
    const uploadPromises = req.files.map((file) =>
      uploadProductImage(file.buffer, file.mimetype, product_id),
    );

    const newImages = await Promise.all(uploadPromises);

    // 2) Get OLD IMAGES from DB
    const product = await productModel.getProductById(product_id);

    let oldImages = [];
    if (product.product_images) {
      oldImages = JSON.parse(product.product_images);
    }

    // 3) Append NEW + OLD images
    const finalImages = [...oldImages, ...newImages];

    // 4) Update DB
    await productModel.updateProductImages(
      product_id,
      JSON.stringify(finalImages),
    );

    res.json({
      success: true,
      message: "Images uploaded",
      images: finalImages,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Upload failed" });
  }
};

exports.replaceProductImage = async (req, res) => {
  try {
    const { product_id, replace_index } = req.body;

    const product = await productModel.getProductByProductId(product_id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const images = JSON.parse(product.product_images || "[]");

    const oldImage = images[replace_index];

    const newURL = await uploadProductImage(
      req.file.buffer,
      req.file.mimetype,
      product_id,
    );

    images[replace_index] = newURL;

    await deleteFromS3(oldImage);

    await productModel.updateProductImages(product_id, JSON.stringify(images));

    res.json({ success: true, message: "Image replaced", images });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Replace failed" });
  }
};
