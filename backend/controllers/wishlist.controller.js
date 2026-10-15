import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

/**
 * Task 2: Add Product to Wishlist
 * POST /wishlist/:productId
 *
 * Requirements:
 * - Protected by auth middleware (req.user)
 * - Do not accept userId from request body
 * - Validate productId (400 if invalid)
 * - Find product (404 if not found)
 * - Prevent duplicates (409 if already wishlisted)
 * - Persist ObjectId reference in MongoDB
 */
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId as a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    // 2. Verify that the product exists in the catalogue
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 3. Find current authenticated user
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    // 4. Duplicate prevention: check if productId already exists in user's wishlist
    const isAlreadyWishlisted = user.wishlist.some(
      (id) => id && id.toString() === productId.toString()
    );

    if (isAlreadyWishlisted) {
      return res.status(409).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    // 5. Add Product ObjectId reference and save user document
    user.wishlist.push(product._id);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    console.error("Error adding product to wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Server error adding product to wishlist",
    });
  }
};

/**
 * Task 3: Get Current User's Wishlist
 * GET /wishlist
 *
 * Requirements:
 * - Protected by auth middleware (req.user)
 * - Identify user strictly from req.user._id (no GET /wishlist/:userId)
 * - Populate wishlist Product references
 * - Return populated product documents
 */
export const getWishlist = async (req, res) => {
  try {
    // Populate the wishlist ObjectId references with full product fields
    const user = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "name description price category image stock createdAt",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    // Filter out any null entries if a referenced product was removed from the database
    const validWishlist = (user.wishlist || []).filter(
      (item) => item !== null && typeof item === "object" && item._id
    );

    return res.status(200).json({
      success: true,
      count: validWishlist.length,
      wishlist: validWishlist,
    });
  } catch (error) {
    console.error("Error retrieving wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving wishlist",
    });
  }
};

/**
 * Task 4: Remove Product from Wishlist
 * DELETE /wishlist/:productId
 *
 * Requirements:
 * - Protected by auth middleware (req.user)
 * - Validate productId (400 if invalid)
 * - Check if product is currently in user's wishlist (404 if not found)
 * - Remove ObjectId reference and save user
 */
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    // 2. Find user document
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    // 3. Locate item in wishlist
    const index = user.wishlist.findIndex(
      (id) => id && id.toString() === productId.toString()
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in wishlist",
      });
    }

    // 4. Remove reference and save
    user.wishlist.splice(index, 1);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Error removing product from wishlist:", error);
    return res.status(500).json({
      success: false,
      message: "Server error removing product from wishlist",
    });
  }
};

/**
 * Bonus Task 23: Wishlist Toggle (+10 Marks)
 * PATCH /wishlist/:productId/toggle
 * (Also supports POST /wishlist/:productId/toggle)
 *
 * If product is already saved -> removes it (saved: false)
 * If product is not saved -> adds it (saved: true)
 */
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const existingIndex = user.wishlist.findIndex(
      (id) => id && id.toString() === productId.toString()
    );

    if (existingIndex !== -1) {
      // Remove from wishlist
      user.wishlist.splice(existingIndex, 1);
      await user.save();

      return res.status(200).json({
        success: true,
        saved: false,
        message: "Product removed from wishlist",
      });
    } else {
      // Verify product exists before adding
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      user.wishlist.push(product._id);
      await user.save();

      return res.status(200).json({
        success: true,
        saved: true,
        message: "Product added to wishlist",
      });
    }
  } catch (error) {
    console.error("Error toggling wishlist item:", error);
    return res.status(500).json({
      success: false,
      message: "Server error toggling wishlist item",
    });
  }
};

/**
 * Bonus Task 24: Wishlist Count (+5 Marks)
 * GET /wishlist/count
 *
 * Returns the count of items in the current user's wishlist from the database
 */
export const getWishlistCount = async (req, res) => {
  try {
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    const count = user.wishlist ? user.wishlist.length : 0;

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error getting wishlist count:", error);
    return res.status(500).json({
      success: false,
      message: "Server error getting wishlist count",
    });
  }
};
