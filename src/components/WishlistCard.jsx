import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

/**
 * Task 6 & Task 7: Wishlist Card Component
 * Displays an individual saved product in the Wishlist grid with:
 *  - Product image
 *  - Product name
 *  - Price (₹ formatted)
 *  - Category
 *  - Stock status
 *  - [ View Details ]
 *  - [ Remove from Wishlist ]
 */
export default function WishlistCard({ product, onRemove }) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState(null);

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

  const handleRemoveClick = async (e) => {
    e.preventDefault();
    if (isRemoving) return;

    setIsRemoving(true);
    setError(null);
    try {
      if (onRemove) {
        await onRemove(_id);
      }
    } catch (err) {
      console.error('Error removing item from wishlist:', err);
      setError('Unable to remove product. Please try again.');
      setIsRemoving(false);
    }
  };

  return (
    <article
      className="wishlist-card"
      id={`wishlist-card-${_id}`}
      data-testid="wishlist-card"
    >
      {/* Product Image Section */}
      <div className="wishlist-card-image-wrap">
        <img
          src={image}
          alt={name}
          className="wishlist-card-image"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
          }}
        />

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

      {/* Product Content Body */}
      <div className="wishlist-card-content">
        <div className="wishlist-card-meta">
          <span className="product-category-text">{category}</span>
        </div>

        <h3 className="wishlist-card-title" title={name}>
          <Link to={`/products/${_id}`} className="product-card-title-link">
            {name}
          </Link>
        </h3>

        <div className="wishlist-card-footer">
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

        {/* Inline Error if removal fails */}
        {error && (
          <div className="card-error-banner" role="alert">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons: View Details & Remove */}
        <div className="wishlist-card-actions">
          <Link
            to={`/products/${_id}`}
            className="btn btn-view-details"
            id={`view-details-${_id}`}
            title="View product details"
          >
            <span>View Details</span>
            <ExternalLink size={14} className="btn-icon" />
          </Link>

          <button
            type="button"
            className="btn btn-remove-wishlist"
            id={`remove-wishlist-${_id}`}
            onClick={handleRemoveClick}
            disabled={isRemoving}
            title="Remove from your saved wishlist"
          >
            {isRemoving ? (
              <>
                <Loader2 size={15} className="spinning" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Remove ♥</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
