const categoryModel = require("../../model/users/categoryModel");

// SLUG GENERATOR
const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
};

// ADD CATEGORY
exports.addCategory = async (req, res) => {
  try {
    const { category_name, category_description, is_featured, is_active } =
      req.body;

    if (!category_name) {
      return res.status(400).json({
        message: "Category Name required",
      });
    }

    const data = {
      category_name,
      category_slug: slugify(category_name),
      category_description,
      is_featured,
      is_active,
    };

    const id = await categoryModel.addCategory(data);

    res.json({
      success: true,
      message: "Category Added",
      id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL
exports.getAllCategory = async (req, res) => {
  try {
    const data = await categoryModel.getAllCategory();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await categoryModel.getCategoryById(id);

    if (!data) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    body.category_slug = slugify(body.category_name);

    const updated = await categoryModel.updateCategory(id, body);

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ success: true, message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await categoryModel.deleteCategory(id);

    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
