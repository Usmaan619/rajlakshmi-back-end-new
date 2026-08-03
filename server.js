const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const compression = require("compression");
const usersRoutes = require("./routes/users/usersRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");
const { errorHandler } = require("./middlewares/errorHandler");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { connectToDatabase } = require("./config/dbConnection");
const helmet = require("helmet");
const { globalRateLimiter } = require("./middlewares/rateLimiter");
const metaFeedRoute = require("./routes/users/metaFeed");
const productsRoutes = require("./routes/users/productRoutes");
const categoryRoutes = require("./routes/users/category.routes");
const blogRoutes = require("./routes/users/blogRoutes");
const checkoutRoutes = require("./routes/users/checkoutRoutes");
const authRoutes = require("./routes/authRoutes");

// ── Middlewares ──────────────────────────────────────────────────────────────

// Security HTTP headers
app.use(helmet());

// Apply global rate limiting
app.use(globalRateLimiter);

// Gzip / Brotli compression — MUST be before any routes
// Compresses all responses > 1 KB automatically
app.use(
  compression({
    level: 6, // balanced speed vs size (1-9)
    threshold: 1024, // only compress responses > 1 KB
    filter: (req, res) => {
      // Compress JSON, HTML, CSS, JS, SVG, etc.
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  }),
);

// CORS — restrictive configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*";
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// Body parsers with reasonable limits
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/users", usersRoutes);
app.use("/admin", adminRoutes);
app.use("/products", productsRoutes);
app.use("/category", categoryRoutes);
app.use("/blogs", blogRoutes);
app.use("/checkout", checkoutRoutes);
app.use("/auth", authRoutes);
app.use("/", metaFeedRoute);

// Error handling middleware
app.use(errorHandler);

// Start the server
async function startServer() {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
