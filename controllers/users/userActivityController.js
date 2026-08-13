const { withConnection } = require("../../utils/helper");

/** =============================
 *  CART ENDPOINTS
 * ============================= */

// Fetch cart for logged-in user
const getUserCart = async (req, res) => {
  try {
    // Expected to receive userId from auth middleware.
    // If not, it can be taken from request body or query (adjust as needed).
    const userId = req.user ? req.user.userId : req.body.user_id || req.query.user_id;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const cartItems = await withConnection(async (connection) => {
      const [rows] = await connection.execute(
        "SELECT * FROM rajlaksmi_cart WHERE user_id = ?",
        [userId]
      );
      return rows;
    });

    res.json({ success: true, cart: cartItems });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
};

// Add or update item in cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : req.body.user_id;
    const { item } = req.body;

    if (!userId || !item) {
      return res.status(400).json({ success: false, message: "User ID and item are required" });
    }

    await withConnection(async (connection) => {
      // Upsert item: if exists by (user_id, unique_id), update quantity
      const query = `
        INSERT INTO rajlaksmi_cart (user_id, product_id, unique_id, name, price, image, quantity, weight, gst_percent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        quantity = VALUES(quantity),
        price = VALUES(price)
      `;
      
      const values = [
        userId,
        item.originalId || item.id,
        item.id, // uniqueId passed from frontend
        item.name,
        item.price,
        item.image || "",
        item.quantity || 1,
        item.weight || "",
        item.gst_percent || 0
      ];

      await connection.execute(query, values);
    });

    res.json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Failed to add to cart" });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : req.body.user_id || req.query.user_id;
    const uniqueId = req.params.uniqueId;

    if (!userId || !uniqueId) {
      return res.status(400).json({ success: false, message: "User ID and unique_id are required" });
    }

    await withConnection(async (connection) => {
      await connection.execute(
        "DELETE FROM rajlaksmi_cart WHERE user_id = ? AND unique_id = ?",
        [userId, uniqueId]
      );
    });

    res.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ success: false, message: "Failed to remove from cart" });
  }
};

// Clear entire cart for a user (e.g. after checkout)
const clearCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : req.body.user_id;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    await withConnection(async (connection) => {
      await connection.execute("DELETE FROM rajlaksmi_cart WHERE user_id = ?", [userId]);
    });

    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ success: false, message: "Failed to clear cart" });
  }
};

// Sync LocalStorage cart with DB (Merge logic)
const syncCart = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : req.body.user_id;
    const { items } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: true, message: "No items to sync" });
    }

    await withConnection(async (connection) => {
      for (const item of items) {
        const query = `
          INSERT INTO rajlaksmi_cart (user_id, product_id, unique_id, name, price, image, quantity, weight, gst_percent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          quantity = quantity + VALUES(quantity),
          price = VALUES(price)
        `;
        
        const values = [
          userId,
          item.originalId || item.id,
          item.id,
          item.name,
          item.price,
          item.image || "",
          item.quantity || 1,
          item.weight || "",
          item.gst_percent || 0
        ];

        await connection.execute(query, values);
      }
    });

    res.json({ success: true, message: "Cart synced successfully" });
  } catch (error) {
    console.error("Error syncing cart:", error);
    res.status(500).json({ success: false, message: "Failed to sync cart" });
  }
};

/** =============================
 *  WISHLIST ENDPOINTS
 * ============================= */

const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : req.body.user_id || req.query.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const wishlistItems = await withConnection(async (connection) => {
      const [rows] = await connection.execute(
        "SELECT * FROM rajlaksmi_wishlist WHERE user_id = ?",
        [userId]
      );
      return rows;
    });

    res.json({ success: true, wishlist: wishlistItems });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : req.body.user_id;
    const { item } = req.body;

    if (!userId || !item) {
      return res.status(400).json({ success: false, message: "User ID and item are required" });
    }

    await withConnection(async (connection) => {
      // Check if item exists
      const [rows] = await connection.execute(
        "SELECT id FROM rajlaksmi_wishlist WHERE user_id = ? AND product_id = ?",
        [userId, item.id]
      );

      if (rows.length > 0) {
        // Remove item
        await connection.execute(
          "DELETE FROM rajlaksmi_wishlist WHERE user_id = ? AND product_id = ?",
          [userId, item.id]
        );
      } else {
        // Add item
        const query = `
          INSERT INTO rajlaksmi_wishlist (user_id, product_id, name, price, image, originalPrice, discount, weightOptions, rating)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          userId,
          item.id,
          item.name,
          item.price,
          item.image || "",
          item.originalPrice || null,
          item.discount || null,
          item.weightOptions ? JSON.stringify(item.weightOptions) : null,
          item.rating || null
        ];

        await connection.execute(query, values);
      }
    });

    res.json({ success: true, message: "Wishlist toggled successfully" });
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    res.status(500).json({ success: false, message: "Failed to toggle wishlist" });
  }
};

const syncWishlist = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : req.body.user_id;
    const { items } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: true, message: "No items to sync" });
    }

    await withConnection(async (connection) => {
      for (const item of items) {
        const query = `
          INSERT IGNORE INTO rajlaksmi_wishlist (user_id, product_id, name, price, image, originalPrice, discount, weightOptions, rating)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          userId,
          item.id,
          item.name,
          item.price,
          item.image || "",
          item.originalPrice || null,
          item.discount || null,
          item.weightOptions ? JSON.stringify(item.weightOptions) : null,
          item.rating || null
        ];

        await connection.execute(query, values);
      }
    });

    res.json({ success: true, message: "Wishlist synced successfully" });
  } catch (error) {
    console.error("Error syncing wishlist:", error);
    res.status(500).json({ success: false, message: "Failed to sync wishlist" });
  }
};

/** =============================
 *  ADMIN ENDPOINTS
 * ============================= */

// Get all users who have active carts (for Admin visibility)
const getAdminActiveCarts = async (req, res) => {
  try {
    // Join cart with users to get user details
    const activeCarts = await withConnection(async (connection) => {
      const query = `
        SELECT 
          u.id as user_id, 
          u.full_name as user_name, 
          u.email as user_email, 
          u.mobile_number as user_phone,
          c.product_id, 
          c.unique_id, 
          c.name as product_name, 
          c.price, 
          c.quantity, 
          c.weight, 
          c.image,
          c.created_at,
          c.updated_at
        FROM rajlaksmi_cart c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.updated_at DESC
      `;
      const [rows] = await connection.execute(query);
      
      // Group by user
      const usersMap = {};
      
      rows.forEach(row => {
        if (!usersMap[row.user_id]) {
          usersMap[row.user_id] = {
            user_id: row.user_id,
            user_name: row.user_name,
            user_email: row.user_email,
            user_phone: row.user_phone,
            last_active: row.updated_at,
            cart_total: 0,
            items: []
          };
        }
        
        usersMap[row.user_id].items.push({
          unique_id: row.unique_id,
          product_id: row.product_id,
          name: row.product_name,
          price: row.price,
          quantity: row.quantity,
          weight: row.weight,
          image: row.image,
          added_at: row.created_at
        });
        
        usersMap[row.user_id].cart_total += (parseFloat(row.price) * parseInt(row.quantity));
        
        // Update last active if this item is more recently updated
        if (new Date(row.updated_at) > new Date(usersMap[row.user_id].last_active)) {
          usersMap[row.user_id].last_active = row.updated_at;
        }
      });
      
      return Object.values(usersMap).sort((a, b) => new Date(b.last_active) - new Date(a.last_active));
    });

    res.json({ success: true, activeCarts });
  } catch (error) {
    console.error("Error fetching admin active carts:", error);
    res.status(500).json({ success: false, message: "Failed to fetch active carts" });
  }
};

module.exports = {
  getUserCart,
  addToCart,
  removeFromCart,
  clearCart,
  syncCart,
  getUserWishlist,
  toggleWishlist,
  syncWishlist,
  getAdminActiveCarts
};
