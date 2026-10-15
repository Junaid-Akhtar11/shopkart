import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
  getWishlistCount,
} from "../controllers/wishlist.controller.js";

const router = express.Router();

// All wishlist routes require authentication via JWT
router.use(protect);

// Specific subroutes first
router.get("/count", getWishlistCount);

// Root collection route
router.get("/", getWishlist);

// Single product toggle route (Bonus Task 23)
router.patch("/:productId/toggle", toggleWishlist);
router.post("/:productId/toggle", toggleWishlist);

// Product item routes
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);

export default router;
