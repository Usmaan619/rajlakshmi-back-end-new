const express = require("express");
const router = express.Router();
const productModel = require("../../model/users/productModal"); // path adjust karo

router.get("/meta-feed", async (req, res) => {
  try {
    const products = await productModel.getAllProducts();

    // CSV header
    let csv =
      "id,title,description,availability,condition,price,link,image_link,brand\n";

    products.forEach((p) => {
      let images = [];

      try {
        images = JSON.parse(p.product_images);
      } catch (e) {
        images = [];
      }

      const row = [
        p.product_id,
        `"${p.product_name} ${p.product_weight}"`,
        `"${p.product_name} - ${p.product_weight}"`,
        "in stock",
        "new",
        `${p.product_price} INR`,
        `https://gauswarn.com/product/${p.product_id}`,
        images[0] || "",
        "Gauswarn",
      ].join(",");

      csv += row + "\n";
    });

    res.header("Content-Type", "text/csv");
    res.send(csv);
  } catch (err) {
    console.error("Meta feed error:", err);
    res.status(500).send("Feed error");
  }
});

module.exports = router;
