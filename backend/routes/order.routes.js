import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  createPaymentOrder,
  verifyPayment,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

// All order routes are strictly protected by JWT authentication
router.use(protect);

// POST /orders/create-payment-order - Validate cart, create pending order and Razorpay order
router.post("/create-payment-order", createPaymentOrder);

// POST /orders - Backward compatibility fallback for POST /orders
router.post("/", createPaymentOrder);

// POST /orders/verify-payment - Verify Razorpay payment signature & confirm order
router.post("/verify-payment", verifyPayment);

// GET /orders - Retrieve all orders for authenticated user
router.get("/", getUserOrders);

// GET /orders/:id - Retrieve single order details (ownership enforced)
router.get("/:id", getOrderById);

// PATCH /orders/:id/status - Bonus: Update order status progression
router.patch("/:id/status", updateOrderStatus);

export default router;
