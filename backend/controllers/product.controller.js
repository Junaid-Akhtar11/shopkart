import mongoose from 'mongoose';
import Product from '../models/product.model.js';

/**
 * Task 2: Create Product API
 * POST /products
 * Inserts a new product into the database.
 */
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // 1. Validate mandatory fields
    if (
      !name ||
      typeof name !== 'string' ||
      !name.trim() ||
      !description ||
      typeof description !== 'string' ||
      !description.trim() ||
      price === undefined ||
      price === null ||
      price === '' ||
      !category ||
      typeof category !== 'string' ||
      !category.trim() ||
      !image ||
      typeof image !== 'string' ||
      !image.trim() ||
      stock === undefined ||
      stock === null ||
      stock === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field. name, description, price, category, image, and stock are mandatory.',
      });
    }

    // 2. Validate price: must be greater than 0
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price. Price must be greater than 0.',
      });
    }

    // 3. Validate stock: cannot be negative
    const parsedStock = Number(stock);
    if (isNaN(parsedStock) || parsedStock < 0 || !Number.isInteger(parsedStock)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stock. Stock must be an integer and cannot be negative.',
      });
    }

    // 4. Create and save product document
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      category: category.trim(),
      image: image.trim(),
      stock: parsedStock,
    });

    const productObj = product.toObject();

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
      ...productObj,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating product',
    });
  }
};

/**
 * Task 3 & Task 5: Get All Products API (with Search, Category Filter, and Sorting)
 * GET /products
 * Supports query parameters:
 *  - search: case-insensitive regex match on product name
 *  - category: filter by specific category
 *  - sort: price_asc | price_desc | newest
 */
export const getAllProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const filter = {};

    // Task 5: Search products by name (case-insensitive)
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: escapedSearch, $options: 'i' };
    }

    // Task 5: Filter by category (case-insensitive)
    if (
      category &&
      typeof category === 'string' &&
      category.trim().length > 0 &&
      category.trim().toLowerCase() !== 'all'
    ) {
      const escapedCategory = category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.category = { $regex: `^${escapedCategory}$`, $options: 'i' };
    }

    // Bonus Challenge: Sorting by price / date
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'name_asc') {
      sortOptions = { name: 1 };
    } else if (sort === 'name_desc') {
      sortOptions = { name: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    // Query MongoDB with projection and sorting
    const products = await Product.find(filter)
      .sort(sortOptions)
      .select('_id name price category image stock createdAt');

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching products',
    });
  }
};

/**
 * Task 4: Get Single Product API
 * GET /products/:id
 * Fetches full details for a product by its MongoDB _id.
 */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await Product.findById(id);

    // Handle non-existent product
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const productObj = product.toObject();

    return res.status(200).json({
      success: true,
      product,
      ...productObj,
    });
  } catch (error) {
    console.error('Error fetching single product:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching product',
    });
  }
};

/**
 * Helper Endpoint: Get Distinct Categories
 * GET /products/categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching categories',
    });
  }
};
