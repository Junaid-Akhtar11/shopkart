import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart,
} from "../controllers/cart.controller.js";

const router = express.Router();

// All cart routes require authentication via JWT
router.use(protect);

// GET /cart - Get current user's cart
router.get("/", getCart);

// POST /cart/:productId - Add product to cart (or increment quantity)
router.post("/:productId", addToCart);

// PATCH /cart/:productId - Update quantity
router.patch("/:productId", updateQuantity);

// DELETE /cart/:productId - Remove product from cart
router.delete("/:productId", removeFromCart);

export default router;
