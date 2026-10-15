import crypto from "crypto";
import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import razorpay from "../config/razorpay.js";

/**
 * Task 4: Create Payment Order
 * POST /orders/create-payment-order
 *
 * Request body:
 * {
 *   shippingAddress: {
 *     fullName,
 *     phone,
 *     addressLine1,
 *     city,
 *     state,
 *     pincode
 *   }
 * }
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // 1. Validate shipping address fields
    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress;

    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !addressLine1?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All shipping address fields are required and cannot be empty",
      });
    }

    // Phone format validation (10 digits standard)
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number (at least 10 digits)",
      });
    }

    // Pincode validation: must be 6 digits
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode.trim())) {
      return res.status(400).json({
        success: false,
        message: "Pincode must contain exactly 6 digits",
      });
    }

    // 2. Load authenticated user & cart
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty. Add products to cart before checkout.",
      });
    }

    // 3. Load latest product documents and verify stock & calculate server total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of user.cart) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Cart contains invalid product references",
        });
      }

      const productDoc = await Product.findById(item.product);
      if (!productDoc) {
        return res.status(400).json({
          success: false,
          message: "One or more products in your cart are no longer available",
        });
      }

      const quantity = Number(item.quantity) || 1;
      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product ${productDoc.name}`,
        });
      }

      // Check stock
      if (productDoc.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${productDoc.name}. Available: ${productDoc.stock}, requested: ${quantity}`,
        });
      }

      // Snapshot product info at time of purchase
      orderItems.push({
        product: productDoc._id,
        name: productDoc.name,
        price: productDoc.price,
        quantity: quantity,
        image: productDoc.image || "",
      });

      totalAmount += productDoc.price * quantity;
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid calculated total amount",
      });
    }

    // 4. Create pending ShopKart order
    const shopKartOrder = new Order({
      user: user._id,
      items: orderItems,
      shippingAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    await shopKartOrder.save();

    // 5. Create Razorpay order (amount in paise = rupees * 100)
    const amountInPaise = Math.round(totalAmount * 100);
    let razorpayOrderId = `order_sim_${shopKartOrder._id}`;

    // If Razorpay keys are configured and not placeholders, call Razorpay API
    if (
      process.env.RAZORPAY_KEY_ID &&
      !process.env.RAZORPAY_KEY_ID.includes("placeholder") &&
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.RAZORPAY_KEY_SECRET.includes("placeholder")
    ) {
      try {
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: shopKartOrder._id.toString(),
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.error("Razorpay Order creation error:", rzpErr);
        return res.status(500).json({
          success: false,
          message: rzpErr.error?.description || "Failed to initialize Razorpay payment order",
        });
      }
    }

    // Save razorpayOrderId to the ShopKart order
    shopKartOrder.razorpayOrderId = razorpayOrderId;
    await shopKartOrder.save();

    // 6. Return safe checkout data (Never expose RAZORPAY_KEY_SECRET)
    return res.status(200).json({
      success: true,
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId: razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder_key_id",
      order: shopKartOrder,
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process checkout order",
    });
  }
};

/**
 * Task 11 & 12: Verify Payment Signature
 * POST /orders/verify-payment
 *
 * Request body:
 * {
 *   shopKartOrderId,
 *   razorpay_order_id,
 *   razorpay_payment_id,
 *   razorpay_signature
 * }
 */
export const verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!shopKartOrderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are missing",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ShopKart order ID format",
      });
    }

    // Find order
    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Ensure user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot access or modify another user's order",
      });
    }

    // Use Razorpay Order ID stored in DB as the trusted identifier
    const trustedOrderId = order.razorpayOrderId || razorpay_order_id;

    // Verify HMAC SHA256 Signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret_key";
    const body = `${trustedOrderId}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = "FAILED";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature. Payment verification failed.",
      });
    }

    // Payment signature is valid -> Confirm order
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Deduct stock for purchased items
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    // Task 5: Clear user's cart ONLY after payment signature is verified
    const user = await Customer.findById(req.user._id);
    if (user) {
      user.cart = [];
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Order placed!",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};

/**
 * Task 7: Get All Orders for Current User
 * GET /orders
 * Sorted newest order first
 */
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
    });
  }
};

/**
 * Task 17: Get Single Order by ID
 * GET /orders/:id
 * Enforces ownership: only order owner can view it
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Enforce ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order details error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order details",
    });
  }
};

/**
 * Bonus Challenge (+10 Marks): Update Order Status
 * PATCH /orders/:id/status
 * Allowed values: PLACED, CONFIRMED, SHIPPED, DELIVERED
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Ownership or admin check
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};
