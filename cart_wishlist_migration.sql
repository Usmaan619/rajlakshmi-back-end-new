-- Phase 1: Database Schema for Cart and Wishlist

-- Table for storing user cart items
CREATE TABLE IF NOT EXISTS rajlaksmi_cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    unique_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(500),
    quantity INT DEFAULT 1,
    weight VARCHAR(100),
    gst_percent DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_item (user_id, unique_id)
);

-- Table for storing user wishlist items
CREATE TABLE IF NOT EXISTS rajlaksmi_wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(500),
    originalPrice DECIMAL(10,2),
    discount DECIMAL(5,2),
    weightOptions JSON,
    rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_wishlist (user_id, product_id)
);
