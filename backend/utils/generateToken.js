import jwt from "jsonwebtoken";

/**
 * Generate a JSON Web Token (JWT) with customer id payload
 * @param {string|mongoose.Types.ObjectId} customerId
 * @returns {string} signed JWT token
 */
export const generateToken = (customerId) => {
  const secret = process.env.JWT_SECRET || "shopkart_super_secret_jwt_key_2026_secure";
  return jwt.sign({ id: customerId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Secure cookie configuration options for JWT storage
 */
export const cookieOptions = {
  httpOnly: true, // Prevents client-side scripts from accessing the cookie (XSS protection)
  secure: process.env.NODE_ENV === "production", // Enforces HTTPS in production
  sameSite: "strict", // Protects against Cross-Site Request Forgery (CSRF)
};

/**
 * Cookie lifespan: 7 days in milliseconds
 */
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
