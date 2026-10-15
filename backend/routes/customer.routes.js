import express from "express";
import {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  logoutCustomer,
  changePassword,
} from "../controllers/customer.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public Routes
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// Protected Routes
router.get("/me", protect, getMyProfile);
router.post("/logout", protect, logoutCustomer);
router.patch("/change-password", protect, changePassword);

export default router;
