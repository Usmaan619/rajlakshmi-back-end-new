/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  ONE-TIME MIGRATION: Compress Existing Base64 Images in Database
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *  USAGE:
 *    node scripts/compress_existing_images.js
 *
 *  FLAGS:
 *    --dry-run    : Check kitni badi images hain aur kitni shrink hongi (bina DB change kiye)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

require("dotenv").config();
const { pool } = require("../config/dbConnection");
const sharp = require("sharp");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

// Helper to extract buffer from Base64 string
const base64ToBuffer = (base64String) => {
  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;
  return {
    type: matches[1],
    buffer: Buffer.from(matches[2], "base64"),
  };
};

// Helper to compress buffer using Sharp
const compressImage = async (buffer) => {
  return await sharp(buffer)
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
};

const formatSize = (bytes) => (bytes / 1024).toFixed(2) + " KB";

async function processImages() {
  console.log("\n" + "═".repeat(70));
  console.log("  COMPRESSING EXISTING BASE64 IMAGES IN DB");
  console.log("═".repeat(70));
  if (DRY_RUN) console.log("  🔍 DRY RUN MODE — no changes will be made to DB\n");

  const connection = await pool.getConnection();

  try {
    // ── 1. COMPRESS PRODUCTS ──────────────────────────────────────────────
    const [products] = await connection.execute(
      `SELECT id, product_name, product_images FROM rajlaksmi_product ORDER BY id ASC`
    );

    console.log(`📦 Found ${products.length} Products to check...`);
    let totalSavedBytes = 0;

    for (const product of products) {
      if (!product.product_images) continue;

      let imagesArray = [];
      try {
        imagesArray = JSON.parse(product.product_images);
      } catch (e) {
        imagesArray = [product.product_images];
      }

      let isModified = false;
      const newImagesArray = [];

      for (let i = 0; i < imagesArray.length; i++) {
        const imgString = imagesArray[i];

        // Skip non-images or very small images (< 50KB base64 string length)
        if (typeof imgString !== "string" || !imgString.startsWith("data:image/") || imgString.length < 50000) {
          newImagesArray.push(imgString);
          continue;
        }

        // Avoid re-compressing webp unless it's huge
        if (imgString.startsWith("data:image/webp;") && imgString.length < 200000) {
           newImagesArray.push(imgString);
           continue;
        }

        const extracted = base64ToBuffer(imgString);
        if (!extracted) {
          newImagesArray.push(imgString);
          continue;
        }

        try {
          const originalSize = extracted.buffer.length;
          const compressedBuffer = await compressImage(extracted.buffer);
          const compressedSize = compressedBuffer.length;

          if (compressedSize < originalSize) {
            const newBase64 = `data:image/webp;base64,${compressedBuffer.toString("base64")}`;
            newImagesArray.push(newBase64);
            isModified = true;
            
            const saved = originalSize - compressedSize;
            totalSavedBytes += saved;
            console.log(`  [Product #${product.id}] Image ${i}: ${formatSize(originalSize)} ➔ ${formatSize(compressedSize)} (Saved ${formatSize(saved)})`);
          } else {
            newImagesArray.push(imgString);
          }
        } catch (err) {
          console.error(`  [Product #${product.id}] Error compressing image ${i}:`, err.message);
          newImagesArray.push(imgString);
        }
      }

      if (isModified && !DRY_RUN) {
        await connection.execute(
          `UPDATE rajlaksmi_product SET product_images = ? WHERE id = ?`,
          [JSON.stringify(newImagesArray), product.id]
        );
      }
    }

    // ── 2. COMPRESS BLOGS ─────────────────────────────────────────────────
    console.log(`\n📝 Checking Blogs...`);
    const [blogs] = await connection.execute(
      `SELECT id, title, image_url FROM rajlaksmi_blog ORDER BY id ASC`
    );

    for (const blog of blogs) {
      const imgString = blog.image_url;
      if (typeof imgString !== "string" || !imgString.startsWith("data:image/") || imgString.length < 50000) {
        continue;
      }
      if (imgString.startsWith("data:image/webp;") && imgString.length < 200000) {
         continue;
      }

      const extracted = base64ToBuffer(imgString);
      if (!extracted) continue;

      try {
        const originalSize = extracted.buffer.length;
        const compressedBuffer = await compressImage(extracted.buffer);
        const compressedSize = compressedBuffer.length;

        if (compressedSize < originalSize) {
          const newBase64 = `data:image/webp;base64,${compressedBuffer.toString("base64")}`;
          
          const saved = originalSize - compressedSize;
          totalSavedBytes += saved;
          console.log(`  [Blog #${blog.id}] Cover: ${formatSize(originalSize)} ➔ ${formatSize(compressedSize)} (Saved ${formatSize(saved)})`);
          
          if (!DRY_RUN) {
            await connection.execute(
              `UPDATE rajlaksmi_blog SET image_url = ? WHERE id = ?`,
              [newBase64, blog.id]
            );
          }
        }
      } catch (err) {
        console.error(`  [Blog #${blog.id}] Error compressing cover:`, err.message);
      }
    }

    console.log("\n" + "─".repeat(70));
    console.log(`🎉 SUMMARY`);
    console.log(`   Total space saved in DB: ${(totalSavedBytes / (1024 * 1024)).toFixed(2)} MB`);
    if (DRY_RUN) {
      console.log(`   💡 This was a Dry Run. Run without --dry-run to apply changes.`);
    }
    console.log("─".repeat(70) + "\n");

  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    connection.release();
    pool.end();
  }
}

processImages();
