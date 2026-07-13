const asyncHandler = require("express-async-handler");
const cartModel = require("../../model/users/cartModel"); // Make sure to import your cart model
const moment = require("moment");

// Add to Cart Endpoint
// exports.addToCart = asyncHandler(async (req, res, next) => {
//   const {
//     product_id,
//     user_id,
//     product_name,
//     product_price,
//     product_weight,
//     product_quantity,
//     product_total_amount,
//     purchase_price,
//   } = req.body;
//

//   // Validate required fields
//   if (
//     !product_id ||
//     !user_id ||
//     !product_price ||
//     !product_weight ||
//     !product_quantity ||
//     !product_total_amount ||
//     !purchase_price
//   ) {
//     return res.json({
//       message: "Please provide all required fields",
//       date: moment().format("MMMM Do YYYY, h:mm:ss a"),
//     });
//   }

//   try {
//     // Check if the product is already in the user's cart

//     const cartItems = await cartModel.findCartItem(product_id, user_id); // Assuming it returns an array

//     if (!cartItems?.length && cartItems?.length > 0) {
//       // If the product is already in the cart (cartItems is an array)
//       const cartItem = cartItems[0]; // Access the first item if only one is expected

//       const newQuantity = cartItem?.product_quantity + product_quantity;
//       const newTotalAmount =
//         cartItem?.product_total_amount + product_total_amount;

//       // Update the cart item in the database
//       await cartModel.updateCartItem(
//         user_id,
//         product_id,
//         newQuantity,
//         newTotalAmount
//       );
//       return res.json({
//         message: "Product updated in cart",
//         date: moment().format("MMMM Do YYYY, h:mm:ss a"),
//       });
//     } else {
//       // If the product is not in the cart, create a new entry
//       await cartModel.addCartItem({
//         user_id,
//         product_id,
//         product_name,
//         product_price,
//         product_weight,
//         product_quantity,
//         product_total_amount,
//         purchase_price,
//       });
//       return res.status(201).json({
//         message: "Product added to cart",
//         date: moment().format("MMMM Do YYYY, h:mm:ss a"),
//       });
//     }
//   } catch (error) {
//     // Catch any errors and send an appropriate response

//     next(error);
//     return res.json({
//       message: "Server error, failed to add to cart",
//       error,
//       date: moment().format("MMMM Do YYYY, h:mm:ss a"),
//     });
//   }
// });

exports.addToCart = asyncHandler(async (req, res, next) => {
  const {
    product_id,
    user_id,
    product_name,
    product_price,
    product_weight,
    product_quantity,
    product_total_amount,
    purchase_price,
  } = req.body;

  // Validate required fields
  if (
    !product_id ||
    !user_id ||
    !product_price ||
    !product_weight ||
    !product_quantity ||
    !product_total_amount ||
    !purchase_price
  ) {
    return res.json({
      message: "Please provide all required fields",
      date: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  }

  try {
    // Check if the product is already in the user's cart
    const cartItems = await cartModel.findCartItem(product_id, user_id);

    if (cartItems.length > 0) {
      // If product exists, update quantity and total amount
      const cartItem = cartItems[0];

      const newQuantity = cartItem.product_quantity + product_quantity;
      const newTotalAmount =
        cartItem.product_total_amount + product_total_amount;

      // Update the cart item in the database
      await cartModel.updateCartItem(
        user_id,
        product_id,
        newQuantity,
        newTotalAmount,
      );

      return res.json({
        message: "Product quantity updated in cart",
        date: moment().format("MMMM Do YYYY, h:mm:ss a"),
      });
    } else {
      // If product does not exist, create a new entry
      await cartModel.addCartItem({
        user_id,
        product_id,
        product_name,
        product_price,
        product_weight,
        product_quantity,
        product_total_amount,
        purchase_price,
      });

      return res.status(201).json({
        message: "Product added to cart",
        date: moment().format("MMMM Do YYYY, h:mm:ss a"),
      });
    }
  } catch (error) {
    next(error);
    return res.status(500).json({
      message: "Server error, failed to add to cart",
      error: error.message,
      date: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  }
});

exports.removeFromCart = asyncHandler(async (req, res) => {
  try {
    const { product_id, user_id } = req.query;

    // Validate required fields
    if (!product_id || !user_id) {
      return res.json({
        success: false,
        message: "Please provide all required fields",
      });
    }
    const cartItems = await cartModel.removeFromCartModal(user_id, product_id); // Assuming it returns an array

    return res.status(201).json({ success: true, message: cartItems?.message });
  } catch (error) {
    // Catch any errors and send an appropriate response
    console.error(
      "Error while adding to cart:removeFromCart",
      error,
      moment().format("MMMM Do YYYY, h:mm:ss a"),
    );
    return res.json({
      message: "Server error, failed to add to cart",
      error,
      date: moment().format("MMMM Do YYYY, h:mm:ss a"),
      success: false,
    });
  }
});

exports.updateFromCart = asyncHandler(async (req, res, next) => {
  try {
    const { product_id, user_id, product_quantity, product_total_amount } =
      req.body;

    if (!product_id && !user_id) {
      return res.json({
        message: "Please provide all required fields updateFromCart",
        date: moment().format("MMMM Do YYYY, h:mm:ss a"),
      });
    }

    const cartItem = await cartModel.findCartItem(product_id, user_id);

    if (!cartItem) {
      return res.json({
        message: "Cart item not found",
        date: moment().format("MMMM Do YYYY, h:mm:ss a"),
      });
    }

    await cartModel.updateCartItem(
      user_id,
      product_id,
      product_quantity,
      product_total_amount,
    );

    return res.json({
      message: "Product updated in cart",
      date: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  } catch (error) {
    next(error);
    return res.json({
      message: "Server error, failed to update cart",
      date: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  }
});
