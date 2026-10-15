import axios from 'axios';

/**
 * Axios instance configured for ShopKart API communication.
 * `withCredentials: true` ensures HttpOnly JWT cookies are sent with every request
 * and stored automatically by the browser upon login/registration.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Task 1: Register Customer
 * POST /customers/register
 * @param {Object} userData - { fullName, email, password, phone }
 * @returns {Promise<Object>} API response data
 */
export const registerCustomer = async (userData) => {
  const response = await api.post('/customers/register', userData);
  return response.data;
};

/**
 * Task 2: Login Customer
 * POST /customers/login
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} API response data
 */
export const loginCustomer = async (credentials) => {
  const response = await api.post('/customers/login', credentials);
  return response.data;
};

/**
 * Task 3: Fetch Current Customer Profile
 * GET /customers/me
 * @returns {Promise<Object>} API response containing customer profile
 */
export const getCurrentCustomer = async () => {
  const response = await api.get('/customers/me');
  return response.data;
};

/**
 * Task 4: Logout Customer
 * POST /customers/logout
 * @returns {Promise<Object>} API response data
 */
export const logoutCustomer = async () => {
  const response = await api.post('/customers/logout');
  return response.data;
};

/**
 * Task 3 & Task 5: Get All Products (with Search, Category, and Sort filters)
 * GET /products
 * @param {Object} params - { search, category, sort }
 * @returns {Promise<Object>} API response data with { success, count, products }
 */
export const getProducts = async (params = {}) => {
  const cleanParams = {};
  if (params.search && params.search.trim()) {
    cleanParams.search = params.search.trim();
  }
  if (params.category && params.category !== 'All' && params.category.trim()) {
    cleanParams.category = params.category.trim();
  }
  if (params.sort && params.sort.trim()) {
    cleanParams.sort = params.sort.trim();
  }

  const response = await api.get('/products', { params: cleanParams });
  return response.data;
};

/**
 * Task 4 & Task 8: Get Single Product by ID
 * GET /products/:id
 * @param {string} id - MongoDB ObjectId string
 * @returns {Promise<Object>} API response data with { success, product }
 */
export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

/**
 * Helper: Fetch all distinct product categories
 * GET /products/categories
 * @returns {Promise<Object>} API response data with { success, categories }
 */
export const getCategories = async () => {
  const response = await api.get('/products/categories');
  return response.data;
};

/**
 * Task 2: Create a new product
 * POST /products
 * @param {Object} productData
 * @returns {Promise<Object>}
 */
export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

/**
 * Task 2: Add Product to Wishlist
 * POST /wishlist/:productId
 * @param {string} productId
 * @returns {Promise<Object>} { success: true, message: string }
 */
export const addToWishlist = async (productId) => {
  const response = await api.post(`/wishlist/${productId}`);
  return response.data;
};

/**
 * Task 3: Get Current User's Wishlist
 * GET /wishlist
 * @returns {Promise<Object>} { success: true, count: number, wishlist: Array }
 */
export const getWishlist = async () => {
  const response = await api.get('/wishlist');
  return response.data;
};

/**
 * Task 4: Remove Product from Wishlist
 * DELETE /wishlist/:productId
 * @param {string} productId
 * @returns {Promise<Object>} { success: true, message: string }
 */
export const removeFromWishlist = async (productId) => {
  const response = await api.delete(`/wishlist/${productId}`);
  return response.data;
};

/**
 * Bonus Task 23: Wishlist Toggle (+10 Marks)
 * PATCH /wishlist/:productId/toggle
 * @param {string} productId
 * @returns {Promise<Object>} { success: true, saved: boolean, message: string }
 */
export const toggleWishlist = async (productId) => {
  const response = await api.patch(`/wishlist/${productId}/toggle`);
  return response.data;
};

/**
 * Bonus Task 24: Wishlist Count (+5 Marks)
 * GET /wishlist/count
 * @returns {Promise<Object>} { success: true, count: number }
 */
export const getWishlistCount = async () => {
  const response = await api.get('/wishlist/count');
  return response.data;
};

/**
 * Lab 05 - Task 2: Add Product to Cart
 * POST /cart/:productId
 * @param {string} productId
 * @returns {Promise<Object>} { success: true, message: string, cart: Array }
 */
export const addToCart = async (productId) => {
  const response = await api.post(`/cart/${productId}`);
  return response.data;
};

/**
 * Lab 05 - Task 3: Get Current User's Cart
 * GET /cart
 * @returns {Promise<Object>} { success: true, cart: Array }
 */
export const getCart = async () => {
  const response = await api.get('/cart');
  return response.data;
};

/**
 * Lab 05 - Task 4: Update Cart Item Quantity
 * PATCH /cart/:productId
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Object>} { success: true, message: string, cart: Array }
 */
export const updateCartQuantity = async (productId, quantity) => {
  const response = await api.patch(`/cart/${productId}`, { quantity });
  return response.data;
};

/**
 * Lab 05 - Task 5: Remove Product from Cart
 * DELETE /cart/:productId
 * @param {string} productId
 * @returns {Promise<Object>} { success: true, message: string, cart: Array }
 */
export const removeFromCart = async (productId) => {
  const response = await api.delete(`/cart/${productId}`);
  return response.data;
};

/**
 * Lab 06 - Task 4: Create Payment Order
 * POST /orders/create-payment-order
 * @param {Object} data - { shippingAddress }
 * @returns {Promise<Object>}
 */
export const createPaymentOrder = async (data) => {
  const response = await api.post('/orders/create-payment-order', data);
  return response.data;
};

/**
 * Lab 06 - Task 11: Verify Razorpay Payment
 * POST /orders/verify-payment
 * @param {Object} paymentData - { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * @returns {Promise<Object>}
 */
export const verifyPayment = async (paymentData) => {
  const response = await api.post('/orders/verify-payment', paymentData);
  return response.data;
};

/**
 * Lab 06 - Task 7: Get All Orders for Current User
 * GET /orders
 * @returns {Promise<Object>} { success: true, orders: Array }
 */
export const getUserOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

/**
 * Lab 06 - Task 17: Get Single Order Details
 * GET /orders/:id
 * @param {string} id - Order ID
 * @returns {Promise<Object>} { success: true, order: Object }
 */
export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

/**
 * Lab 06 - Bonus: Update Order Status Progression
 * PATCH /orders/:id/status
 * @param {string} id
 * @param {string} status
 * @returns {Promise<Object>}
 */
export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};

/**
 * Utility helper to extract readable error message from Axios error
 * @param {Error} error
 * @returns {string} Error message to display in UI
 */
export const getErrorMessage = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  if (error.request) {
    return 'Unable to connect to ShopKart server. Please make sure the backend is running.';
  }
  return error.message || 'An unexpected error occurred. Please try again.';
};

export default api;
