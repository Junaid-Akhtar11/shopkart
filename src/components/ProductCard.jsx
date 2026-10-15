import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Heart,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Plus,
} from 'lucide-react';
import { addToWishlist, removeFromWishlist } from '../services/api';
import { useCart } from '../context/CartContext';

/**
 * Task 7: Product Card Integration
 * Default: [ Add to Cart ]
 * While request is running: [ Adding... ]
 * If already in cart: [ Add Another ] (or [ Add to Cart ])
 * Also preserves Wishlist interaction from Lab 04.
 */
export default function ProductCard({
  product,
  isWishlisted = false,
  onWishlistChange,
}) {
  const [saved, setSaved] = useState(isWishlisted);
  const [isSavingWishlist, setIsSavingWishlist] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();

  const { addItemToCart, itemActionLoading, isProductInCart, getProductCartQuantity } = useCart();

  if (!product) return null;

  const {
    _id,
    name,
    price,
    category,
    image,
    stock = 0,
  } = product;

  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  const isAddingToCart = itemActionLoading[_id] === 'adding';
  const inCart = isProductInCart(_id);
  const currentQuantityInCart = getProductCartQuantity(_id);
  const hasReachedStock = currentQuantityInCart >= stock;

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSavingWishlist) return;

    setIsSavingWishlist(true);
    setErrorMessage(null);

    try {
      if (saved) {
        await removeFromWishlist(_id);
        setSaved(false);
        if (onWishlistChange) onWishlistChange(_id, false);
      } else {
        await addToWishlist(_id);
        setSaved(true);
        if (onWishlistChange) onWishlistChange(_id, true);
      }
    } catch (err) {
      console.error('Wishlist action error:', err);
      if (err.response && err.response.status === 409) {
        setSaved(true);
        if (onWishlistChange) onWishlistChange(_id, true);
      } else if (err.response && err.response.status === 401) {
        setErrorMessage('Please sign in to save products.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setErrorMessage('Unable to save product. Please try again.');
      }
    } finally {
      setIsSavingWishlist(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddingToCart || isOutOfStock || hasReachedStock) return;

    setErrorMessage(null);
    try {
      await addItemToCart(_id);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setErrorMessage('Please sign in to add products to your cart.');
        setTimeout(() => navigate('/login'), 1500);
      } else if (err.response && err.response.data && err.response.data.message) {
        setErrorMessage(err.response.data.message);
      } else if (err.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to add product to cart.');
      }
    }
  };

  return (
    <article
      className={`product-card ${saved ? 'is-wishlisted' : ''}`}
      id={`product-card-${_id}`}
      data-testid="product-card"
    >
      {/* Product Image Section */}
      <div className="product-card-image-wrap">
        <img
          src={image}
          alt={name}
          className="product-card-image"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
          }}
        />

        {/* Floating Heart Button over image */}
        <button
          type="button"
          className={`wishlist-floating-btn ${saved ? 'active' : ''} ${isSavingWishlist ? 'loading' : ''}`}
          id={`wishlist-float-btn-${_id}`}
          onClick={handleWishlistToggle}
          disabled={isSavingWishlist}
          title={saved ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label={saved ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          {isSavingWishlist ? (
            <Loader2 size={18} className="spinner-icon spinning" />
          ) : (
            <Heart size={18} className={saved ? 'fill-current' : ''} />
          )}
        </button>

        {/* Category Pill Over Image */}
        <span className="product-category-badge">
          <Layers size={12} className="inline-icon" />
          {category}
        </span>

        {/* Stock Status Badge */}
        {isOutOfStock ? (
          <span className="product-stock-tag out-of-stock">
            <AlertTriangle size={12} /> Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="product-stock-tag low-stock">
            <AlertTriangle size={12} /> Only {stock} left
          </span>
        ) : (
          <span className="product-stock-tag in-stock">
            <CheckCircle2 size={12} /> In Stock ({stock})
          </span>
        )}
      </div>

      {/* Product Body Content */}
      <div className="product-card-content">
        <div className="product-card-meta">
          <span className="product-category-text">{category}</span>
          {inCart && (
            <span className="in-cart-indicator" title={`You have ${currentQuantityInCart} in your cart`}>
              In Cart ({currentQuantityInCart})
            </span>
          )}
        </div>

        <h3 className="product-card-title" title={name}>
          <Link to={`/products/${_id}`} className="product-card-title-link">
            {name}
          </Link>
        </h3>

        <div className="product-card-footer">
          <div className="product-card-pricing">
            <span className="price-currency">₹</span>
            <span className="price-amount">{Number(price).toLocaleString('en-IN')}</span>
          </div>

          <div className="product-card-stock-label">
            {isOutOfStock ? (
              <span className="text-danger">Unavailable</span>
            ) : (
              <span className="text-muted">{stock} units left</span>
            )}
          </div>
        </div>

        {/* Inline Error State if action fails */}
        {errorMessage && (
          <div className="card-error-banner" role="alert">
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Card Action Row: Add to Cart (Task 7) & View Details */}
        <div className="product-card-actions-row">
          <button
            type="button"
            className={`btn btn-add-cart-primary ${inCart ? 'in-cart-active' : ''}`}
            id={`add-to-cart-btn-${_id}`}
            onClick={handleAddToCart}
            disabled={isAddingToCart || isOutOfStock || hasReachedStock}
          >
            {isAddingToCart ? (
              <>
                <Loader2 size={16} className="spinning" />
                <span>Adding...</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : hasReachedStock ? (
              <span>Max Stock Reached</span>
            ) : inCart ? (
              <>
                <Plus size={16} />
                <span>Add Another</span>
              </>
            ) : (
              <>
                <ShoppingCart size={16} />
                <span>Add to Cart</span>
              </>
            )}
          </button>

          <Link
            to={`/products/${_id}`}
            className="btn btn-view-details"
            id={`view-details-${_id}`}
            title="View Details"
          >
            <span>Details</span>
            <ArrowRight size={15} className="btn-icon" />
          </Link>
        </div>
      </div>
    </article>
  );
}
