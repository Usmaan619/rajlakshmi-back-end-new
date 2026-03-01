const asyncHandler = require("express-async-handler");
const reviewModel = require("../../model/users/feedbackModel");

// Add a new review
exports.feedback = asyncHandler(async (req, res) => {
  try {
    const { product_id, name, title, email, rating, feedback } = req.body;
    if (!name || !email || !rating || !product_id) {
      return res.json({
        message: "Product ID, Name, email, and rating are required",
      });
    }

    const reviewId = await reviewModel.addReview(
      product_id,
      name,
      title,
      email,
      rating,
      feedback,
    );
    res.status(201).json({
      success: true,
      message: "Review submitted successfully!",
      reviewId,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// Fetch reviews and calculate statistics
exports.getReviews = asyncHandler(async (req, res) => {
  try {
    const reviews = await reviewModel.getAllReviews();

    if (!reviews?.length) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingsBreakdown: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
        reviews: [],
      });
    }
    const totalReviews = reviews?.length;

    const ratingsBreakdown = [1, 2, 3, 4, 5].reduce((acc, rating) => {
      acc[rating] = reviews.filter((review) => review.rating === rating).length;
      return acc;
    }, {});

    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews ||
      0;

    res.json({
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews,
      ratingsBreakdown: {
        5: ((ratingsBreakdown[5] || 0) / totalReviews) * 100,
        4: ((ratingsBreakdown[4] || 0) / totalReviews) * 100,
        3: ((ratingsBreakdown[3] || 0) / totalReviews) * 100,
        2: ((ratingsBreakdown[2] || 0) / totalReviews) * 100,
        1: ((ratingsBreakdown[1] || 0) / totalReviews) * 100,
      },
      reviews,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  } finally {
  }
});

// Fetch reviews for a specific product
exports.getFeedbackByProduct = asyncHandler(async (req, res) => {
  try {
    const { product_id } = req.params;
    const reviews = await reviewModel.getReviewsByProduct(product_id);

    if (!reviews?.length) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingsBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: [],
      });
    }

    const totalReviews = reviews.length;
    const ratingsBreakdown = [1, 2, 3, 4, 5].reduce((acc, rating) => {
      acc[rating] = reviews.filter((review) => review.rating === rating).length;
      return acc;
    }, {});

    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews ||
      0;

    res.json({
      success: true,
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalReviews,
      ratingsBreakdown: {
        5: ((ratingsBreakdown[5] || 0) / totalReviews) * 100,
        4: ((ratingsBreakdown[4] || 0) / totalReviews) * 100,
        3: ((ratingsBreakdown[3] || 0) / totalReviews) * 100,
        2: ((ratingsBreakdown[2] || 0) / totalReviews) * 100,
        1: ((ratingsBreakdown[1] || 0) / totalReviews) * 100,
      },
      reviews,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product reviews" });
  }
});

// new

// Get Single Review by ID
exports.getReviewById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const review = await reviewModel.getReviewByIdModal(id);
    if (!review) {
      return res.json({ message: "Review not found" });
    }
    res.json({ review });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// Update Review
exports.updateReviewById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, email, rating, feedback } = req.body;
    const isUpdated = await reviewModel.updateReviewModal(
      id,
      name,
      title,
      email,
      rating,
      feedback,
    );
    if (!isUpdated) {
      return res.json({ message: "Review not found" });
    }
    res.json({ message: "Review updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update review" });
  }
});

// Delete Review
exports.deleteReviewById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const isDeleted = await reviewModel.deleteReviewModal(id);
    if (!isDeleted) {
      return res.json({ message: "Review not found" });
    }
    res.json({ success: true, message: "Review deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete review" });
  }
});
