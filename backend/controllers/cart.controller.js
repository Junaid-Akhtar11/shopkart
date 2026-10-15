import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

/**
 * Task 2: Add Product to Cart API
 * POST /cart/:productId
 *
 * Requirements:
 * - Protected by auth middleware (req.user)
 * - Validate productId (400 if invalid)
 * - Find product (404 if not found)
 * - If product is not already in cart: add with quantity = 1
 * - If already in cart: increase existing quantity by 1
 * - New quantity must not exceed product stock (400 if exceeds)
 * - Save user and return updated cart populated with product details
 */
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId as a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    // 2. Find product to check existence and stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 3. Find current user
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    if (!user.cart) {
      user.cart = [];
    }

    // 4. Check if item already exists in user cart
    const existingIndex = user.cart.findIndex(
      (item) => item.product && item.product.toString() === productId.toString()
    );

    let targetQuantity = 1;
    if (existingIndex > -1) {
      targetQuantity = (user.cart[existingIndex].quantity || 1) + 1;
    }

    // Check stock limit
    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock",
      });
    }

    if (targetQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${targetQuantity}) exceeds available stock (${product.stock})`,
      });
    }

    // Update or add item
    if (existingIndex > -1) {
      user.cart[existingIndex].quantity = targetQuantity;
    } else {
      user.cart.push({
        product: product._id,
        quantity: 1,
      });
    }

    await user.save();

    // Populate updated cart
    const updatedUser = await Customer.findById(user._id).populate({
      path: "cart.product",
      select: "name description price category image stock createdAt",
    });

    const validCart = (updatedUser.cart || []).filter(
      (item) => item.product !== null && typeof item.product === "object"
    );

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: validCart,
    });
  } catch (error) {
    console.error("Error adding product to cart:", error);
    return res.status(500).json({
      success: false,
      message: "Server error adding product to cart",
    });
  }
};

/**
 * Task 3: Get Current User Cart
 * GET /cart
 *
 * Requirements:
 * - Authenticate user
 * - Load authenticated user
 * - Populate each cart item's Product
 * - Return cart items with quantity
 */
export const getCart = async (req, res) => {
  try {
    const user = await Customer.findById(req.user._id).populate({
      path: "cart.product",
      select: "name description price category image stock createdAt",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    // Filter out items where the referenced product no longer exists in DB
    const validCart = (user.cart || []).filter(
      (item) => item.product !== null && typeof item.product === "object"
    );

    return res.status(200).json({
      success: true,
      cart: validCart,
    });
  } catch (error) {
    console.error("Error retrieving cart:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving cart",
    });
  }
};

/**
 * Task 4: Update Product Quantity
 * PATCH /cart/:productId
 *
 * Request body: { quantity: number }
 * Rules:
 * - Not logged in: 401
 * - Invalid product ID: 400
 * - Product not found: 404
 * - Product not in cart: 404
 * - Quantity < 1: 400
 * - Quantity > stock: 400
 */
export const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    let { quantity } = req.body;

    // 1. Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    // 2. Validate quantity format & range
    if (quantity === undefined || quantity === null || typeof quantity !== "number" || isNaN(quantity)) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a valid number",
      });
    }

    quantity = Math.floor(quantity);

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be less than 1",
      });
    }

    // 3. Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock limit
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Quantity (${quantity}) exceeds available stock (${product.stock})`,
      });
    }

    // 4. Find user
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    if (!user.cart) {
      user.cart = [];
    }

    // 5. Check if product exists in cart
    const existingIndex = user.cart.findIndex(
      (item) => item.product && item.product.toString() === productId.toString()
    );

    if (existingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    // Update quantity and save
    user.cart[existingIndex].quantity = quantity;
    await user.save();

    // Populate and return updated cart
    const updatedUser = await Customer.findById(user._id).populate({
      path: "cart.product",
      select: "name description price category image stock createdAt",
    });

    const validCart = (updatedUser.cart || []).filter(
      (item) => item.product !== null && typeof item.product === "object"
    );

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      cart: validCart,
    });
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating cart quantity",
    });
  }
};

/**
 * Task 5: Remove Product from Cart
 * DELETE /cart/:productId
 *
 * Requirements:
 * - Remove product from authenticated user's cart
 * - Return updated cart
 */
export const removeFromCart = async (req, res) => {
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

    if (!user.cart) {
      user.cart = [];
    }

    const existingIndex = user.cart.findIndex(
      (item) => item.product && item.product.toString() === productId.toString()
    );

    if (existingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }

    user.cart.splice(existingIndex, 1);
    await user.save();

    // Populate and return updated cart
    const updatedUser = await Customer.findById(user._id).populate({
      path: "cart.product",
      select: "name description price category image stock createdAt",
    });

    const validCart = (updatedUser.cart || []).filter(
      (item) => item.product !== null && typeof item.product === "object"
    );

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: validCart,
    });
  } catch (error) {
    console.error("Error removing product from cart:", error);
    return res.status(500).json({
      success: false,
      message: "Server error removing product from cart",
    });
  }
};
