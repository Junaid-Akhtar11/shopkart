import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  AlertCircle,
  RotateCw,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import WishlistCard from '../components/WishlistCard';
import { getWishlist, removeFromWishlist } from '../services/api';

/**
 * Task 6 & Task 7: Wishlist Page
 * Endpoint: GET /wishlist
 *
 * Implements:
 *  - Dynamic rendering of wishlisted products (no hardcoded data)
 *  - Intentional Loading state ("Loading your wishlist...")
 *  - Polished Empty state ("Your wishlist is empty ❤️" + Browse Products CTA)
 *  - Error state ("We couldn't load your wishlist." + Retry button)
 *  - Immediate optimistic/dynamic removal without full-page refresh
 */
export default function Wishlist({ user, onWishlistCountChange }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const navigate = useNavigate();

  const fetchWishlistData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWishlist();
      if (data && data.success && Array.isArray(data.wishlist)) {
        setWishlist(data.wishlist);
        if (onWishlistCountChange) {
          onWishlistCountChange(data.wishlist.length);
        }
      } else if (Array.isArray(data)) {
        setWishlist(data);
        if (onWishlistCountChange) {
          onWishlistCountChange(data.length);
        }
      } else {
        setWishlist([]);
        if (onWishlistCountChange) {
          onWishlistCountChange(0);
        }
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      if (err.response && err.response.status === 401) {
        setError('unauthorized');
      } else {
        setError('We couldn\'t load your wishlist.');
      }
    } finally {
      setLoading(false);
    }
  }, [onWishlistCountChange]);

  useEffect(() => {
    fetchWishlistData();
  }, [fetchWishlistData]);

  // Handle removing a product from wishlist without reloading the page
  const handleRemoveProduct = async (productId) => {
    try {
      await removeFromWishlist(productId);

      // Dynamically remove from local list
      setWishlist((prev) => {
        const updated = prev.filter((item) => item._id !== productId);
        if (onWishlistCountChange) {
          onWishlistCountChange(updated.length);
        }
        return updated;
      });

      setToastMessage('Product removed from your wishlist.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to remove product:', err);
      throw err;
    }
  };

  // State 1: Unauthorized state if user is not logged in
  if (!loading && error === 'unauthorized') {
    return (
      <div className="wishlist-page-container">
        <div className="state-container unauthorized-state" id="wishlist-unauthorized">
          <div className="state-card">
            <div className="state-icon-badge warning-badge">
              <ShieldAlert size={36} />
            </div>
            <h2 className="state-title">Sign In to View Your Wishlist</h2>
            <p className="state-description">
              Your wishlist is securely synced with your ShopKart account. Please log in or
              create an account to access your saved items.
            </p>
            <div className="error-actions-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/login')}
                id="wishlist-login-btn"
              >
                <span>Sign In</span>
                <ArrowRight size={16} />
              </button>
              <Link to="/products" className="btn btn-secondary">
                <span>Browse Catalog</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Loading State (Task 7 & Task 10)
  if (loading) {
    return (
      <div className="wishlist-page-container">
        <div
          className="state-container loading-state"
          id="wishlist-loading-state"
          data-testid="wishlist-loading"
        >
          <div className="state-card">
            <div className="spinner large" />
            <h3 className="state-title">Loading your wishlist...</h3>
            <p className="state-description">
              Syncing your saved favourites from your ShopKart profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Error State (Task 7 & Task 11)
  if (error) {
    return (
      <div className="wishlist-page-container">
        <div
          className="state-container error-state"
          id="wishlist-error-state"
          data-testid="wishlist-error"
        >
          <div className="state-card error-card">
            <div className="state-icon-badge error-badge">
              <AlertCircle size={36} />
            </div>
            <h2 className="state-title">Something went wrong.</h2>
            <p className="state-description">
              {error} Please check your connection and try again.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={fetchWishlistData}
              id="retry-wishlist-btn"
            >
              <RotateCw size={16} />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Empty Wishlist State (Task 7 & Task 9)
  if (wishlist.length === 0) {
    return (
      <div className="wishlist-page-container">
        <div
          className="state-container empty-state wishlist-empty-box"
          id="wishlist-empty-state"
          data-testid="wishlist-empty"
        >
          <div className="state-card empty-card">
            <div className="heart-empty-badge">
              <Heart size={44} className="empty-heart-icon text-rose-500 fill-rose-100" />
            </div>
            <h2 className="state-title">Your wishlist is empty ❤️</h2>
            <p className="state-description">
              Save products you love and find them here later. Browse our collection and click
              the heart icon on any product card!
            </p>
            <Link
              to="/products"
              className="btn btn-primary btn-browse-products"
              id="browse-products-btn"
            >
              <ShoppingBag size={18} />
              <span>Browse Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success / Populated Wishlist Layout (Task 6)
  return (
    <div className="wishlist-page-container" id="wishlist-page">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="wishlist-toast-pill" role="status" aria-live="polite">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section per Product Brief */}
      <section className="wishlist-header-section">
        <div className="wishlist-header-content">
          <div className="wishlist-title-row">
            <div className="wishlist-title-group">
              <h1 className="wishlist-heading" id="wishlist-heading">
                My Wishlist
              </h1>
              <p className="wishlist-count-badge" id="wishlist-count-badge">
                {wishlist.length} {wishlist.length === 1 ? 'product' : 'products'} saved
              </p>
            </div>

            <Link to="/products" className="btn btn-secondary btn-continue-shopping">
              <ShoppingBag size={16} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Wishlist Grid Container */}
      <div className="wishlist-content-wrapper">
        <div
          className="wishlist-grid"
          id="wishlist-grid"
          data-testid="wishlist-grid"
        >
          {wishlist.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              onRemove={handleRemoveProduct}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
