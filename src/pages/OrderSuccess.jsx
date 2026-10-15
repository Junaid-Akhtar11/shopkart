import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  ShoppingBag,
  ArrowRight,
  Truck,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { getOrderById, getErrorMessage } from '../services/api';

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!order && id) {
      setIsLoading(true);
      getOrderById(id)
        .then((res) => {
          if (res.success && res.order) {
            setOrder(res.order);
          } else {
            setError('Could not retrieve order details.');
          }
        })
        .catch((err) => {
          setError(getErrorMessage(err));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, order]);

  if (isLoading) {
    return (
      <div className="order-success-page-container">
        <div className="state-container loading-state">
          <Loader2 size={44} className="spinning text-emerald-400" />
          <h3 className="loading-title">Retrieving your order confirmation...</h3>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-success-page-container">
        <div className="state-container error-state">
          <AlertCircle size={44} className="text-rose-400" />
          <h3 className="error-title">Order Information Unavailable</h3>
          <p className="error-subtitle">{error || 'Unable to locate order record.'}</p>
          <div className="error-action-row">
            <Link to="/orders" className="btn btn-primary">
              View My Orders
            </Link>
            <Link to="/products" className="btn btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success-page-container" id="order-success-page">
      <div className="order-success-card">
        {/* Success Icon */}
        <div className="success-icon-badge">
          <CheckCircle2 size={56} className="text-emerald-400" />
        </div>

        <h1 className="success-title">Order Placed Successfully! 🎉</h1>
        <p className="success-subtitle">
          Thank you for your purchase. Your payment has been verified and your order is confirmed.
        </p>

        {/* Order Meta Pills */}
        <div className="order-meta-grid">
          <div className="meta-card">
            <span className="meta-card-label">Order ID</span>
            <strong className="meta-card-val text-indigo-400" id="confirmed-order-id">
              #{order._id}
            </strong>
          </div>
          <div className="meta-card">
            <span className="meta-card-label">Status</span>
            <span className="status-badge placed" id="confirmed-order-status">
              {order.status || 'PLACED'}
            </span>
          </div>
          <div className="meta-card">
            <span className="meta-card-label">Payment Status</span>
            <span className="status-badge paid">
              {order.paymentStatus || 'PAID'}
            </span>
          </div>
          <div className="meta-card">
            <span className="meta-card-label">Total Amount</span>
            <strong className="meta-card-val text-emerald-400" id="confirmed-order-total">
              ₹{order.totalAmount?.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        {/* Delivery Address Snapshot */}
        {order.shippingAddress && (
          <div className="delivery-snapshot-box">
            <div className="delivery-snapshot-header">
              <MapPin size={18} className="text-indigo-400" />
              <span>Delivering to</span>
            </div>
            <p className="delivery-name">
              <strong>{order.shippingAddress.fullName}</strong> • {order.shippingAddress.phone}
            </p>
            <p className="delivery-street">
              {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
              {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
          </div>
        )}

        {/* Purchased Items List */}
        <div className="order-items-snapshot-list">
          <h3 className="snapshot-items-title">Purchased Items ({order.items?.length || 0})</h3>
          <div className="snapshot-items-stack">
            {order.items?.map((item, idx) => (
              <div key={idx} className="snapshot-item-row">
                <div className="snapshot-item-thumb">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="thumb-placeholder" />
                  )}
                </div>
                <div className="snapshot-item-details">
                  <span className="snapshot-item-name">{item.name}</span>
                  <span className="snapshot-item-meta">
                    Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="snapshot-item-price">
                  ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="order-success-actions">
          <Link to="/orders" className="btn btn-primary" id="view-my-orders-btn">
            <Package size={18} />
            <span>View My Orders</span>
          </Link>
          <Link to="/products" className="btn btn-secondary" id="continue-shopping-btn">
            <ShoppingBag size={18} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
