import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// CORS Middleware for Frontend Integration
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Base Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShopKart Fullstack API (Authentication, Product Catalog & Wishlist) is running",
  });
});

// API Routes
app.use("/cart", cartRoutes);
app.use("/api/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/api/orders", orderRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/customers", customerRoutes);
app.use("/api/customers", customerRoutes);
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/api/products", productRoutes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler caught:", err);
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Database Connection and Server Startup
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopkart";

export const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully");
  }
};

if (process.env.NODE_ENV !== "test") {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`ShopKart Fullstack Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("MongoDB Connection Failed:", err.message);
      process.exit(1);
    });
}

export default app;
