-- Safe Migration Script to add shipping_charge, gst_amount, platform_fee to `orders` table

DELIMITER $$

CREATE PROCEDURE AddColumnsToOrders()
BEGIN
    -- Check and Add shipping_charge
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'shipping_charge' AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_charge DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Check and Add gst_amount
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'gst_amount' AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE orders ADD COLUMN gst_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Check and Add platform_fee
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'orders' AND COLUMN_NAME = 'platform_fee' AND TABLE_SCHEMA = DATABASE()
    ) THEN
        ALTER TABLE orders ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$

DELIMITER ;

-- Execute the procedure
CALL AddColumnsToOrders();

-- Drop the procedure to clean up
DROP PROCEDURE AddColumnsToOrders;
