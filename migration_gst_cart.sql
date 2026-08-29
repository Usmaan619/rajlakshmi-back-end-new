-- =====================================================
-- GST Migration Script — rajlaksmi_cart table
-- Run this in phpMyAdmin or MySQL CLI
-- Safe to run multiple times (IF NOT EXISTS logic)
-- =====================================================

-- Step 1: Add gst_percent to rajlaksmi_cart (if not already present)
ALTER TABLE rajlaksmi_cart
  ADD COLUMN IF NOT EXISTS gst_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER weight;

-- Step 2: Add gst_percent to rajlaksmi_product (if not already present)
ALTER TABLE rajlaksmi_product
  ADD COLUMN IF NOT EXISTS gst_percent DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Step 3: Patch existing cart rows — sync GST from product table
-- This updates any cart item that has gst_percent = 0 or NULL
UPDATE rajlaksmi_cart c
JOIN rajlaksmi_product p ON c.product_id = p.id
SET c.gst_percent = COALESCE(p.gst_percent, 0)
WHERE c.gst_percent = 0 OR c.gst_percent IS NULL;

-- Step 4: Verify — check current cart data with GST
SELECT 
  c.id,
  c.name,
  c.price,
  c.gst_percent,
  ROUND((c.price * c.gst_percent / 100), 2) AS gst_amount,
  c.quantity
FROM rajlaksmi_cart c
ORDER BY c.id DESC
LIMIT 20;

-- =====================================================
-- Done! Cart table now has per-product GST column.
-- =====================================================
