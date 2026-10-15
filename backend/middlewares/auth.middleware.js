import jwt from "jsonwebtoken";
import Customer from "../models/customer.model.js";

/**
 * Authentication Middleware: protects routes by verifying JWT in HttpOnly cookie
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Read JWT from cookies (or fallback to Authorization header if provided)
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Reject if no token is found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Access denied, no token provided",
      });
    }

    // 3. Verify the token signature and expiration
    const secret = process.env.JWT_SECRET || "shopkart_super_secret_jwt_key_2026_secure";
    const decoded = jwt.verify(token, secret);

    // 4. Find the customer in MongoDB (excluding password)
    const customer = await Customer.findById(decoded.id).select("-password");

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Customer account no longer exists",
      });
    }

    // 5. Attach the customer document to req.user for use in controllers
    req.user = customer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
    });
  }
};
