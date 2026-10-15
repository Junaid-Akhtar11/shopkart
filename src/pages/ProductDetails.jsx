import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getProductById,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from '../services/api';
import { useCart } from '../context/CartContext';
import {
  ArrowLeft,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Clock,
  Heart,
  Loader2,
} from 'lucide-react';

/**
 * Product Details Page
 * Dynamic route: /products/:id
 * Fetches single product via GET /products/:id and provides rich detail view with Wishlist actions.
 */
export default function ProductDetails({ user, onWishlistCountChange }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedToast, setAddedToast] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState(null);

  const { addItemToCart, itemActionLoading, isProductInCart, getProductCartQuantity } = useCart();
  const isAddingToCart = itemActionLoading[id] === 'adding';
  const inCart = isProductInCart(id);
  const currentQuantityInCart = getProductCartQuantity(id);

  // Fetch product data
  useEffect(() => {
    let isMounted = true;

    const fetchSingleProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProductById(id);
        if (isMounted) {
          const prodData = data.product || data;
          setProduct(prodData);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching product by ID:', err);
          if (err.response && err.response.status === 404) {
            setError('Product not found. The item may have been removed or does not exist.');
          } else if (err.response && err.response.status === 400) {
            setError('Invalid product ID format provided.');
          } else {
            setError('Something went wrong while loading product details.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSingleProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Check if product is already in user's wishlist
  useEffect(() => {
    if (user && id) {
      getWishlist()
        .then((data) => {
          if (data && data.wishlist) {
            const found = data.wishlist.some(
              (item) => item && item._id && item._id.toString() === id.toString()
            );
            setIsWishlisted(found);
          }
        })
        .catch(() => {});
    }
  }, [user, id]);

  const handleAddToCart = async () => {
    if (isAddingToCart || isOutOfStock) return;
    try {
      await addItemToCart(id);
      setAddedToast(true);
      setTimeout(() => {
        setAddedToast(false);
      }, 3500);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setWishlistError('Please sign in to add items to your cart.');
        setTimeout(() => navigate('/login'), 1500);
      } else if (err.response && err.response.data && err.response.data.message) {
        setWishlistError(err.response.data.message);
      } else {
        setWishlistError('Failed to add item to cart.');
      }
    }
  };

  const handleWishlistToggle = async () => {
    if (isWishlistLoading) return;
    setIsWishlistLoading(true);
    setWishlistError(null);

    try {
      if (isWishlisted) {
        await removeFromWishlist(id);
        setIsWishlisted(false);
        if (onWishlistCountChange) onWishlistCountChange();
      } else {
        await addToWishlist(id);
        setIsWishlisted(true);
        if (onWishlistCountChange) onWishlistCountChange();
      }
    } catch (err) {
      console.error('Wishlist action failed on details page:', err);
      if (err.response && err.response.status === 409) {
        setIsWishlisted(true);
        if (onWishlistCountChange) onWishlistCountChange();
      } else if (err.response && err.response.status === 401) {
        setWishlistError('Please sign in to save products.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setWishlistError('Unable to save product. Please try again.');
      }
    } finally {
      setIsWishlistLoading(false);
    }
  };

  // State 1: Loading
  if (loading) {
    return (
      <div className="product-details-container">
        <div className="state-container loading-state" id="details-loading-state">
          <div className="state-card">
            <div className="spinner large" />
            <h3 className="state-title">Loading product details...</h3>
            <p className="state-description">
              Retrieving item specifications from the ShopKart catalogue...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Error
  if (error || !product) {
    return (
      <div className="product-details-container">
        <div className="state-container error-state" id="details-error-state">
          <div className="state-card error-card">
            <div className="state-icon-badge error-badge">
              <AlertCircle size={36} />
            </div>
            <h3 className="state-title">{error || 'Product Not Found'}</h3>
            <p className="state-description">
              We couldn&apos;t load the requested product details. Check the URL or return to catalogue.
            </p>
            <div className="error-actions-row">
              <Link to="/products" className="btn btn-primary">
                <ArrowLeft size={16} />
                <span>Back to All Products</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    name,
    description,
    price,
    category,
    image,
    stock = 0,
    createdAt,
  } = product;

  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  return (
    <div className="product-details-container" id="product-details-page">
      {/* Navigation Breadcrumb Bar */}
      <nav className="details-breadcrumb-nav" aria-label="Breadcrumb">
        <Link to="/products" className="breadcrumb-back-link">
          <ArrowLeft size={16} />
          <span>Back to Products</span>
        </Link>
        <span className="breadcrumb-divider">/</span>
        <span className="breadcrumb-category">{category}</span>
        <span className="breadcrumb-divider">/</span>
        <span className="breadcrumb-current">{name}</span>
      </nav>

      {/* Main Details Presentation Grid */}
      <div className="details-layout-grid">
        {/* Left Column: Large Product Image Presentation */}
        <div className="details-image-gallery">
          <div className="details-image-card">
            <img
              src={image}
              alt={name}
              className="details-large-image"
              id="product-details-image"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
              }}
            />
            <div className="image-overlay-badge">
              <Layers size={14} />
              <span>{category}</span>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="trust-features-grid">
            <div className="trust-feature-item">
              <Truck size={18} className="trust-icon" />
              <div className="trust-text">
                <span className="trust-title">Free Express Shipping</span>
                <span className="trust-desc">Delivered in 2-3 business days</span>
              </div>
            </div>
            <div className="trust-feature-item">
              <RotateCcw size={18} className="trust-icon" />
              <div className="trust-text">
                <span className="trust-title">30-Day Easy Returns</span>
                <span className="trust-desc">Hassle-free guarantee</span>
              </div>
            </div>
            <div className="trust-feature-item">
              <ShieldCheck size={18} className="trust-icon" />
              <div className="trust-text">
                <span className="trust-title">100% Authentic Product</span>
                <span className="trust-desc">Direct from verified partners</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="details-info-section">
          {/* Category Tag */}
          <div className="details-tag-row">
            <span className="category-pill" id="product-details-category">
              {category}
            </span>
            <span className="product-id-pill">
              ID: <code>{id}</code>
            </span>
          </div>

          {/* Title */}
          <h1 className="details-product-title" id="product-details-name">
            {name}
          </h1>

          {/* Price Header */}
          <div className="details-pricing-box">
            <div className="price-tag">
              <span className="currency-symbol">₹</span>
              <span className="amount-number" id="product-details-price">
                {Number(price).toLocaleString('en-IN')}
              </span>
            </div>
            <span className="tax-inclusive-label">Inclusive of all taxes</span>
          </div>

          {/* Stock Status Indicator */}
          <div className="details-stock-row" id="product-details-stock">
            {isOutOfStock ? (
              <div className="stock-status-pill out-of-stock">
                <AlertTriangle size={16} />
                <span>Currently Out of Stock</span>
              </div>
            ) : isLowStock ? (
              <div className="stock-status-pill low-stock">
                <Clock size={16} />
                <span>Hurry! Only {stock} units left in stock</span>
              </div>
            ) : (
              <div className="stock-status-pill in-stock">
                <CheckCircle2 size={16} />
                <span>In Stock • {stock} units ready to ship</span>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="details-description-box">
            <h3 className="section-label">Product Overview</h3>
            <p className="description-text" id="product-details-description">
              {description}
            </p>
          </div>

          {/* Inline Wishlist Error */}
          {wishlistError && (
            <div className="card-error-banner" role="alert">
              <AlertCircle size={14} />
              <span>{wishlistError}</span>
            </div>
          )}

          {/* Action Row: Add to Cart, Wishlist & Continue */}
          <div className="details-action-group">
            <button
              type="button"
              className={`btn btn-primary btn-add-to-cart ${isOutOfStock ? 'disabled' : ''}`}
              id="add-to-cart-btn"
              disabled={isOutOfStock || isAddingToCart || currentQuantityInCart >= stock}
              onClick={handleAddToCart}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 size={20} className="spinning" />
                  <span>Adding...</span>
                </>
              ) : currentQuantityInCart >= stock ? (
                <span>Max Stock Reached</span>
              ) : inCart ? (
                <>
                  <ShoppingCart size={20} />
                  <span>Add Another ({currentQuantityInCart} in cart)</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                </>
              )}
            </button>

            {/* Wishlist Button on Product Details */}
            <button
              type="button"
              className={`btn ${isWishlisted ? 'btn-wishlist-saved' : 'btn-secondary'} btn-details-wishlist`}
              id="details-wishlist-btn"
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
            >
              {isWishlistLoading ? (
                <>
                  <Loader2 size={18} className="spinning" />
                  <span>⏳ Saving...</span>
                </>
              ) : isWishlisted ? (
                <>
                  <Heart size={18} className="fill-current text-rose-500" />
                  <span>♥ Saved in Wishlist</span>
                </>
              ) : (
                <>
                  <Heart size={18} />
                  <span>♡ Add to Wishlist</span>
                </>
              )}
            </button>

            <Link to="/wishlist" className="btn btn-secondary">
              <Heart size={18} className="text-rose-500" />
              <span>View Wishlist</span>
            </Link>
          </div>

          {/* Toast Banner */}
          {addedToast && (
            <div className="cart-toast-banner" role="status" aria-live="polite">
              <Sparkles size={18} className="toast-icon" />
              <div>
                <strong>Added to cart!</strong> (Preview for Shopping Cart in Lab 05)
              </div>
            </div>
          )}

          {/* Metadata Specs Table */}
          <div className="details-specs-card">
            <h4 className="specs-card-title">Product Details & Specs</h4>
            <div className="specs-table">
              <div className="specs-row">
                <span className="specs-key">Product ID</span>
                <span className="specs-val font-mono">{id}</span>
              </div>
              <div className="specs-row">
                <span className="specs-key">Category</span>
                <span className="specs-val">{category}</span>
              </div>
              <div className="specs-row">
                <span className="specs-key">Available Quantity</span>
                <span className="specs-val">{stock} units</span>
              </div>
              {createdAt && (
                <div className="specs-row">
                  <span className="specs-key">Catalogued On</span>
                  <span className="specs-val">
                    {new Date(createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
