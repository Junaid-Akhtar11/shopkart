import mongoose from 'mongoose';

/**
 * Task 1: Product Model
 * Mongoose schema representing products in the ShopKart catalogue.
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      validate: {
        validator: function (value) {
          return typeof value === 'number' && !isNaN(value) && value > 0;
        },
        message: 'Price must be greater than 0',
      },
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Product image URL is required'],
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Product stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      validate: {
        validator: function (value) {
          return typeof value === 'number' && !isNaN(value) && value >= 0;
        },
        message: 'Stock cannot be negative',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // createdAt is handled explicitly as Date with default Date.now
    versionKey: false, // Clean documents without __v
  }
);

// Index name and category for optimized search and filter queries
productSchema.index({ name: 'text', category: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
