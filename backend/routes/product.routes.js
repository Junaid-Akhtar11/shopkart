import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  getCategories,
} from '../controllers/product.controller.js';

const router = express.Router();

// Helper route to get all distinct categories (must be declared before :id)
router.get('/categories', getCategories);

// Task 2: Create Product
router.post('/', createProduct);

// Task 3 & Task 5 & Bonus: Get All Products (supports ?search=..., ?category=..., ?sort=...)
router.get('/', getAllProducts);

// Task 4: Get Single Product by ID
router.get('/:id', getProductById);

export default router;
