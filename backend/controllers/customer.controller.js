import bcrypt from "bcrypt";
import Customer from "../models/customer.model.js";
import {
  generateToken,
  cookieOptions,
  COOKIE_MAX_AGE,
} from "../utils/generateToken.js";

const SALT_ROUNDS = 10;

/**
 * Helper to validate non-empty string input
 */
const isNonEmpty = (value) =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Format customer document safely without password
 */
const formatCustomer = (customer) => ({
  _id: customer._id,
  fullName: customer.fullName,
  email: customer.email,
  phone: customer.phone,
});

/**
 * Task 1: Register Customer
 * POST /customers/register
 */
export const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // 1. Validate mandatory fields
    if (
      !isNonEmpty(fullName) ||
      !isNonEmpty(email) ||
      !isNonEmpty(password) ||
      !isNonEmpty(phone)
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2. Validate password length (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Check for existing email (uniqueness validation)
    const existingCustomer = await Customer.findOne({ email: normalizedEmail });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // 4. Hash password with bcrypt before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 5. Create new customer document
    const customer = await Customer.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
    });

    // 6. Return response with customer object (excluding password)
    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: formatCustomer(customer),
    });
  } catch (error) {
    // Handle MongoDB duplicate key error code 11000 gracefully
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Task 2: Login Customer
 * POST /customers/login
 */
export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input fields
    if (!isNonEmpty(email) || !isNonEmpty(password)) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find customer by email (explicitly selecting password since select: false in schema)
    const customer = await Customer.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    // Generic error message to prevent account enumeration
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 3. Verify password hash using bcrypt
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 4. Generate JWT
    const token = generateToken(customer._id);

    // 5. Store JWT in an HttpOnly cookie
    res.cookie("token", token, {
      ...cookieOptions,
      maxAge: COOKIE_MAX_AGE,
    });

    // 6. Return success response with customer info (excluding password)
    return res.status(200).json({
      success: true,
      message: "Login successful",
      customer: formatCustomer(customer),
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Task 3: My Profile
 * GET /customers/me
 * Protected Route
 */
export const getMyProfile = async (req, res) => {
  try {
    // req.user was populated by the auth.middleware.js
    return res.status(200).json(formatCustomer(req.user));
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Task 4: Logout Customer
 * POST /customers/logout
 * Protected Route
 */
export const logoutCustomer = async (req, res) => {
  try {
    // Clear the authentication cookie with same options
    res.clearCookie("token", cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Bonus Challenge: Change Password
 * PATCH /customers/change-password
 * Protected Route
 */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // 1. Validate required fields
    if (!isNonEmpty(oldPassword) || !isNonEmpty(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    // 2. Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 6 characters",
      });
    }

    // 3. Find customer with stored password hash
    const customer = await Customer.findById(req.user._id).select("+password");
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 4. Verify old password using bcrypt
    const isOldPasswordCorrect = await bcrypt.compare(
      oldPassword,
      customer.password
    );
    if (!isOldPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Incorrect old password",
      });
    }

    // 5. Hash new password before saving
    customer.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
