import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';

/**
 * Task 8 & 13: Cart Page
 * Route: /cart
 *
 * Requirements:
 * - Loading state: "Loading your cart..."
 * - Empty state: "Your cart is empty 🛒 ... [ Browse Products ]"
 * - Error state: "Unable to load your cart. ... [ Try Again ]"
 * - Cart item list with quantity controls
 * - Order summary with calculated total items, subtotal, and Proceed to Checkout
 * - Shared source of truth via useCart
 */
export default function Cart({ user }) {
  const navigate = useNavigate();
  const {
    cartItems,
    isLoading,
    error,
    subtotal,
    totalUnits,
    refreshCart,
    clearError,
  } = useCart();

  // If user is not logged in
  if (!user) {
    return (
      <div className="cart-page-container">
        <div className="cart-auth-required-card" id="cart-auth-required">
          <div className="empty-cart-icon-circle">
            <ShoppingBag size={48} className="text-indigo-400" />
          </div>
          <h2 className="empty-cart-title">Sign in to view your cart</h2>
          <p className="empty-cart-subtitle">
            Your shopping cart is securely stored with your account. Sign in or register to view your saved items and proceed to checkout.
          </p>
          <div className="empty-cart-actions">
            <Link to="/login" className="btn btn-primary">
              <span>Sign In to ShopKart</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/products" className="btn btn-secondary">
              <span>Browse Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 1: Loading
  if (isLoading && cartItems.length === 0) {
    return (
      <div className="cart-page-container">
        <div className="state-container loading-state" id="cart-loading-state">
          <Loader2 size={44} className="spinning text-indigo-400" />
          <h3 className="loading-title">Loading your cart...</h3>
          <p className="loading-subtitle">
            Retrieving your cart items, verified stock and latest prices from MongoDB
          </p>
        </div>
      </div>
    );
  }

  // State 2: Error
  if (error && cartItems.length === 0) {
    return (
      <div className="cart-page-container">
        <div className="state-container error-state" id="cart-error-state">
          <div className="error-icon-circle">
            <AlertCircle size={40} className="text-rose-400" />
          </div>
          <h3 className="error-title">Unable to load your cart.</h3>
          <p className="error-subtitle">{error}</p>
          <div className="error-action-row">
            <button
              type="button"
              className="btn btn-primary"
              id="try-again-cart-btn"
              onClick={() => {
                clearError();
                refreshCart();
              }}
            >
              <RefreshCw size={16} />
              <span>Try Again</span>
            </button>
            <Link to="/products" className="btn btn-secondary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Empty
  if (cartItems.length === 0) {
    return (
      <div className="cart-page-container">
        <div className="state-container empty-cart-state" id="cart-empty-state">
          <div className="empty-cart-icon-circle">
            <ShoppingBag size={52} className="text-indigo-400" />
          </div>
          <h2 className="empty-cart-title">Your cart is empty 🛒</h2>
          <p className="empty-cart-subtitle">
            Looks like you haven't added anything yet. Explore our curated catalogue and find great gear!
          </p>
          <div className="empty-cart-actions">
            <Link to="/products" className="btn btn-primary" id="browse-products-cart-empty">
              <span>Browse Products</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Populated Cart with Items & Order Summary
  return (
    <div className="cart-page-container" id="cart-page">
      {/* Page Header */}
      <div className="cart-header-section">
        <div>
          <h1 className="cart-page-heading" id="cart-page-title">
            My Cart
          </h1>
          <p className="cart-page-subheading">
            Review your items, adjust quantities, and proceed to checkout.
          </p>
        </div>
        <div className="cart-summary-badge">
          <span>{totalUnits} {totalUnits === 1 ? 'unit' : 'units'} in cart</span>
        </div>
      </div>

      {/* Cart Content Layout: Two Columns */}
      <div className="cart-layout-grid">
        {/* Left Column: Cart Items List */}
        <div className="cart-items-column">
          <div className="cart-items-list-header">
            <span>Product Details</span>
            <span>Quantity & Controls</span>
            <span>Total</span>
          </div>

          <div className="cart-items-stack" id="cart-items-list">
            {cartItems.map((item) => (
              <CartItem key={item.product?._id || item._id} item={item} />
            ))}
          </div>

          <div className="cart-actions-footer">
            <Link to="/products" className="btn btn-secondary">
              <span>← Continue Shopping</span>
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={refreshCart}
              title="Sync cart with server"
            >
              <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
              <span>Sync with server</span>
            </button>
          </div>
        </div>

        {/* Right Column: Order Summary Card (Task 8 & 15) */}
        <aside className="cart-summary-column">
          <div className="order-summary-card" id="order-summary-card">
            <h2 className="order-summary-title">Order Summary</h2>

            <div className="order-summary-rows">
              <div className="summary-row">
                <span className="summary-label">Total Unique Products</span>
                <span className="summary-val font-semibold">{cartItems.length}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Total Units</span>
                <span className="summary-val font-semibold" id="summary-total-units">
                  {totalUnits}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Estimated Shipping</span>
                <span className="summary-val text-emerald-400 font-semibold">FREE</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Taxes & GST</span>
                <span className="summary-val text-muted">Included</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-row summary-total-row">
                <span className="summary-total-label">Subtotal</span>
                <span className="summary-total-amount" id="cart-subtotal-amount">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <Link
              to="/checkout"
              className="btn btn-primary btn-checkout full-width"
              id="proceed-to-checkout-btn"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </Link>

            {/* Trust Points */}
            <div className="summary-trust-points">
              <div className="trust-point">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Secure SSL checkout</span>
              </div>
              <div className="trust-point">
                <Truck size={16} className="text-indigo-400" />
                <span>Instant dispatch guarantee</span>
              </div>
              <div className="trust-point">
                <RotateCcw size={16} className="text-indigo-400" />
                <span>30-day hassle-free returns</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
