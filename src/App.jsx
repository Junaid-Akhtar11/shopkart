import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderSuccess from './pages/OrderSuccess';
import { CartProvider } from './context/CartContext';
import { getCurrentCustomer, logoutCustomer, getWishlistCount } from './services/api';

/**
 * Main App Content Component (inside BrowserRouter so useNavigate works)
 */
function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const navigate = useNavigate();

  // Helper to fetch backend wishlist count
  const refreshWishlistCount = useCallback(async () => {
    try {
      const data = await getWishlistCount();
      if (data && typeof data.count === 'number') {
        setWishlistCount(data.count);
      }
    } catch {
      // User may be unauthenticated
      setWishlistCount(0);
    }
  }, []);

  // Check initial authentication state using GET /customers/me
  useEffect(() => {
    let ignore = false;
    getCurrentCustomer()
      .then((customer) => {
        if (!ignore) {
          setCurrentUser(customer);
          refreshWishlistCount();
        }
      })
      .catch(() => {
        if (!ignore) {
          setCurrentUser(null);
          setWishlistCount(0);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshWishlistCount]);

  // Handle successful login
  const handleLoginSuccess = (customer) => {
    setCurrentUser(customer);
    refreshWishlistCount();
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } catch (err) {
      console.warn('Logout API error or session already expired:', err);
    } finally {
      setCurrentUser(null);
      setWishlistCount(0);
      navigate('/login');
    }
  };

  return (
    <CartProvider user={currentUser}>
      <div className="app-shell">
        {/* Global Navigation Bar with Cart count and Wishlist badge */}
        <Navbar
          user={currentUser}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />

        {/* Main Page Routing */}
        <main className="main-content">
          <Routes>
            {/* Registration Page */}
            <Route path="/register" element={<Register />} />

            {/* Login Page */}
            <Route
              path="/login"
              element={<Login onLoginSuccess={handleLoginSuccess} />}
            />

            {/* Protected Home Dashboard */}
            <Route
              path="/home"
              element={<Home onUserLoaded={setCurrentUser} />}
            />

            {/* Product Listing & Search/Filter Catalog */}
            <Route
              path="/products"
              element={
                <Products
                  user={currentUser}
                  onWishlistCountChange={refreshWishlistCount}
                />
              }
            />

            {/* Product Details Dynamic Route */}
            <Route
              path="/products/:id"
              element={
                <ProductDetails
                  user={currentUser}
                  onWishlistCountChange={refreshWishlistCount}
                />
              }
            />

            {/* Wishlist Route */}
            <Route
              path="/wishlist"
              element={
                <Wishlist
                  user={currentUser}
                  onWishlistCountChange={setWishlistCount}
                />
              }
            />

            {/* Lab 05 - Task 8: Cart Route */}
            <Route
              path="/cart"
              element={<Cart user={currentUser} />}
            />

            {/* Lab 06 - Task 2: Checkout Route */}
            <Route
              path="/checkout"
              element={<Checkout user={currentUser} />}
            />

            {/* Lab 06 - Task 6: Order Success Route */}
            <Route
              path="/order-success/:id"
              element={<OrderSuccess />}
            />

            {/* Lab 06 - Task 8: Orders List Route */}
            <Route
              path="/orders"
              element={<Orders user={currentUser} />}
            />

            {/* Single Order Route alias */}
            <Route
              path="/orders/:id"
              element={<OrderSuccess />}
            />

            {/* Root Redirect to /products */}
            <Route
              path="/"
              element={<Navigate to="/products" replace />}
            />

            {/* Wildcard Fallback */}
            <Route
              path="*"
              element={<Navigate to="/products" replace />}
            />
          </Routes>
        </main>

        {/* Modern Footer */}
        <footer className="app-footer">
          <div className="footer-content">
            <p className="footer-text">
              ShopKart Engineering Lab 06 • Full Checkout Flow, Order Snapshots, Razorpay Test Payments, Cart Sync & Order Tracking
            </p>
            <div className="footer-badges">
              <span className="footer-pill">React 19</span>
              <span className="footer-pill">Razorpay SDK</span>
              <span className="footer-pill">MongoDB & Mongoose</span>
              <span className="footer-pill">JWT Protected APIs</span>
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
