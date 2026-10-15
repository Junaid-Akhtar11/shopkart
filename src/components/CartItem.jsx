import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

/**
 * Task 14: Quantity Controls Component ([-] 2 [+])
 * & Cart Item Row Component
 *
 * Rules:
 * - '+' increases quantity by 1 (up to stock limit)
 * - '-' decreases quantity by 1 (minimum 1)
 * - 'Remove' button removes item from cart
 * - Shows line total: ₹(product.price * quantity)
 * - Shows single item action loading state
 */
export default function CartItem({ item }) {
  const { updateQuantity, removeItemFromCart, itemActionLoading } = useCart();

  if (!item || !item.product) return null;

  const product = item.product;
  const productId = product._id;
  const quantity = Number(item.quantity) || 1;
  const price = Number(product.price) || 0;
  const stock = Number(product.stock) || 0;
  const lineTotal = price * quantity;

  const isUpdating = itemActionLoading[productId] === 'updating';
  const isRemoving = itemActionLoading[productId] === 'removing';
  const isBusy = isUpdating || isRemoving;

  const canDecrease = quantity > 1;
  const canIncrease = quantity < stock;

  const handleDecrease = async () => {
    if (!canDecrease || isBusy) return;
    try {
      await updateQuantity(productId, quantity - 1);
    } catch (err) {
      console.error('Failed to decrease quantity:', err);
    }
  };

  const handleIncrease = async () => {
    if (!canIncrease || isBusy) return;
    try {
      await updateQuantity(productId, quantity + 1);
    } catch (err) {
      console.error('Failed to increase quantity:', err);
    }
  };

  const handleRemove = async () => {
    if (isBusy) return;
    try {
      await removeItemFromCart(productId);
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  return (
    <div className={`cart-item-card ${isBusy ? 'item-busy' : ''}`} id={`cart-item-${productId}`}>
      {/* Product Image */}
      <div className="cart-item-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="cart-item-image"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';
          }}
        />
      </div>

      {/* Product Details Info */}
      <div className="cart-item-info">
        <span className="cart-item-category">{product.category}</span>
        <h3 className="cart-item-title">
          <Link to={`/products/${productId}`} className="cart-item-title-link">
            {product.name}
          </Link>
        </h3>
        <div className="cart-item-unit-price">
          Unit Price: <strong>₹{price.toLocaleString('en-IN')}</strong>
        </div>

        {/* Stock warning if close to limit */}
        {stock <= 5 && (
          <span className="cart-stock-warning">
            Only {stock} available in stock
          </span>
        )}
      </div>

      {/* Quantity Controls (Task 14) */}
      <div className="cart-item-quantity-section">
        <div className="quantity-controller" aria-label="Quantity controls">
          <button
            type="button"
            className="qty-btn qty-btn-minus"
            id={`qty-minus-${productId}`}
            onClick={handleDecrease}
            disabled={!canDecrease || isBusy}
            title={canDecrease ? 'Decrease quantity' : 'Minimum quantity is 1'}
            aria-label="Decrease quantity"
          >
            <Minus size={15} />
          </button>

          <span className="qty-number" id={`qty-val-${productId}`}>
            {isUpdating ? <Loader2 size={14} className="spinning inline" /> : quantity}
          </span>

          <button
            type="button"
            className="qty-btn qty-btn-plus"
            id={`qty-plus-${productId}`}
            onClick={handleIncrease}
            disabled={!canIncrease || isBusy}
            title={canIncrease ? 'Increase quantity' : 'Maximum stock reached'}
            aria-label="Increase quantity"
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Remove button */}
        <button
          type="button"
          className="btn-cart-remove"
          id={`cart-remove-${productId}`}
          onClick={handleRemove}
          disabled={isBusy}
          title="Remove from cart"
        >
          {isRemoving ? (
            <>
              <Loader2 size={14} className="spinning" />
              <span>Removing...</span>
            </>
          ) : (
            <>
              <Trash2 size={14} />
              <span>Remove</span>
            </>
          )}
        </button>
      </div>

      {/* Line Item Total */}
      <div className="cart-item-line-total">
        <span className="line-total-label">Subtotal</span>
        <span className="line-total-price" id={`line-total-${productId}`}>
          ₹{lineTotal.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}
