const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const usersRoutes = require("./routes/users/usersRoutes");
const adminRoutes = require("./routes/admin/adminRoutes");
const { errorHandler } = require("./middlewares/errorHandler");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { connectToDatabase } = require("./config/dbConnection");
const metaFeedRoute = require("./routes/users/metaFeed");
const productsRoutes = require("./routes/users/productRoutes");

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow specific origins or all origins
app.use(
  cors({
    origin: "*", // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    credentials: true, // If you need to allow credentials (e.g., cookies)
  }),
);

// Routes
app.use("/users", usersRoutes);

app.use("/admin", adminRoutes);
app.use("/products", productsRoutes);

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
