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
    const totalReviews = reviews.length;

    const ratingsBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumRatings = 0;

    reviews.forEach((review) => {
      const r = parseFloat(review.rating) || 0;
      sumRatings += r;
      const rounded = Math.round(r);
      if (rounded >= 1 && rounded <= 5) {
        ratingsBreakdown[rounded]++;
      }
    });

    const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

    res.json({
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews,
      ratingsBreakdown,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  } finally {
  }
});

// Fetch reviews for a specific product with pagination
exports.getFeedbackByProduct = asyncHandler(async (req, res) => {
  try {
    const { product_id } = req.params;
    const limit = parseInt(req.query.limit) || 3;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Fetch data concurrently
    const [reviews, stats, breakdownRows] = await Promise.all([
      reviewModel.getReviewsByProduct(product_id, limit, offset),
      reviewModel.getReviewsCountByProduct(product_id),
      reviewModel.getRatingsBreakdownByProduct(product_id),
    ]);

    const totalReviews = stats.total || 0;
    const sumRatings = parseFloat(stats.totalRating) || 0;
    const averageRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

    const ratingsBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdownRows.forEach((row) => {
      const r = Math.round(parseFloat(row.rating));
      if (r >= 1 && r <= 5) {
        ratingsBreakdown[r] = row.count;
      }
    });

    res.json({
      success: true,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews,
      ratingsBreakdown,
      reviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
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
