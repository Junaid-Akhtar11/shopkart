import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Prevents password hash from being selected by default in queries
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // Task 1: Extend User Schema with wishlist referencing Product
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // Lab 05 - Task 1: Extend User Schema with cart
    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: [1, "Quantity cannot be less than 1"],
        },
      },
    ],
  },
  {
    versionKey: false,
  }
);

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
