const { withConnection } = require("../../utils/helper");

exports.addReview = async (
  product_id,
  name,
  title,
  email,
  rating,
  feedback,
) => {
  try {
    return await withConnection(async (connection) => {
      const query = `
        INSERT INTO rajlaksmi_feedback (product_id, name, title, email, rating, feedback)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.execute(query, [
        product_id,
        name,
        title,
        email,
        rating,
        feedback,
      ]);
      return result.insertId;
    });
  } catch (error) {
    console.error("Database Error:", error.message);
    throw error;
  }
};

// Fetch all reviews
exports.getAllReviews = async () => {
  try {
    return await withConnection(async (connection) => {
      const query = "SELECT * FROM rajlaksmi_feedback";
      const [rows] = await connection.execute(query);
      return rows;
    });
  } catch (error) {
    console.log("error: ", error);
  }
};

// Fetch reviews by product_id with pagination
exports.getReviewsByProduct = async (product_id, limit, offset) => {
  try {
    return await withConnection(async (connection) => {
      let query = "SELECT * FROM rajlaksmi_feedback WHERE product_id = ? ORDER BY id DESC";
      let params = [product_id];

      if (limit !== undefined && offset !== undefined) {
        query += " LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));
      }

      const [rows] = await connection.execute(query, params);
      return rows;
    });
  } catch (error) {
    console.error("Database Error:", error.message);
    throw error;
  }
};

// Get total reviews count for a product
exports.getReviewsCountByProduct = async (product_id) => {
  try {
    return await withConnection(async (connection) => {
      const query = "SELECT COUNT(*) as total, SUM(rating) as totalRating FROM rajlaksmi_feedback WHERE product_id = ?";
      const [rows] = await connection.execute(query, [product_id]);
      return rows[0];
    });
  } catch (error) {
    console.error("Database Error:", error.message);
    throw error;
  }
};

// Get ratings breakdown for a product
exports.getRatingsBreakdownByProduct = async (product_id) => {
  try {
    return await withConnection(async (connection) => {
      const query = `
        SELECT rating, COUNT(*) as count 
        FROM rajlaksmi_feedback 
        WHERE product_id = ? 
        GROUP BY rating
      `;
      const [rows] = await connection.execute(query, [product_id]);
      return rows;
    });
  } catch (error) {
    console.error("Database Error:", error.message);
    throw error;
  }
};

// new

// Get Single Review by ID
exports.getReviewByIdModal = async (user_id) => {
  try {
    return await withConnection(async (connection) => {
      const query = "SELECT * FROM rajlaksmi_feedback WHERE user_id = ?";
      const [review] = await connection.execute(query, [user_id]);
      return review.length > 0 ? review[0] : null;
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Update Review
exports.updateReviewModal = async (
  user_id,
  name,
  title,
  email,
  rating,
  feedback,
) => {
  try {
    return await withConnection(async (connection) => {
      const query = `
      UPDATE rajlaksmi_feedback
      SET name = ?, title = ?, email = ?, rating = ?, feedback = ?
      WHERE id = ?
      `;
      const [result] = await connection.execute(query, [
        name,
        title,
        email,
        rating,
        feedback,
        user_id,
      ]);
      return result.affectedRows > 0;
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

// Delete Review
exports.deleteReviewModal = async (user_id) => {
  try {
    return await withConnection(async (connection) => {
      const query = "DELETE FROM rajlaksmi_feedback WHERE id = ?";
      const [result] = await connection.execute(query, [user_id]);
      return result.affectedRows > 0;
    });
  } catch (error) {
    throw new Error(error.message);
  }
};
