import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  MapPin,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { getUserOrders, updateOrderStatus, getErrorMessage } from '../services/api';

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserOrders();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Bonus Handler: Status progression
  const handleStatusChange = async (orderId, nextStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatus(orderId, nextStatus);
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o))
        );
      }
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  if (!user) {
    return (
      <div className="orders-page-container">
        <div className="cart-auth-required-card">
          <div className="empty-cart-icon-circle">
            <Package size={48} className="text-indigo-400" />
          </div>
          <h2 className="empty-cart-title">Sign in to view your orders</h2>
          <p className="empty-cart-subtitle">
            Your previous purchases and historical order tracking are saved to your account.
          </p>
          <div className="empty-cart-actions">
            <Link to="/login" className="btn btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="orders-page-container">
        <div className="state-container loading-state" id="orders-loading-state">
          <Loader2 size={44} className="spinning text-indigo-400" />
          <h3 className="loading-title">Loading your orders...</h3>
          <p className="loading-subtitle">Fetching your purchase history from database</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="orders-page-container">
        <div className="state-container error-state" id="orders-error-state">
          <AlertCircle size={44} className="text-rose-400" />
          <h3 className="error-title">Unable to load orders</h3>
          <p className="error-subtitle">{error}</p>
          <button type="button" className="btn btn-primary" onClick={fetchOrders}>
            <RotateCcw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (orders.length === 0) {
    return (
      <div className="orders-page-container">
        <div className="state-container empty-cart-state" id="orders-empty-state">
          <div className="empty-cart-icon-circle">
            <Package size={52} className="text-indigo-400" />
          </div>
          <h2 className="empty-cart-title">You have not placed any orders yet</h2>
          <p className="empty-cart-subtitle">
            Once you checkout and pay, your orders and tracking details will appear here.
          </p>
          <div className="empty-cart-actions">
            <Link to="/products" className="btn btn-primary" id="start-shopping-orders-empty">
              <span>Start Shopping</span>
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-container" id="orders-page">
      <div className="orders-header-section">
        <div>
          <h1 className="orders-page-heading" id="orders-page-title">
            My Orders
          </h1>
          <p className="orders-page-subheading">
            Review your previous purchases, order status, and delivery details.
          </p>
        </div>
        <div className="cart-summary-badge">
          <span>{orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</span>
        </div>
      </div>

      <div className="orders-list-stack" id="orders-list">
        {orders.map((order) => {
          const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={order._id} className="order-card" id={`order-card-${order._id}`}>
              {/* Order Card Header */}
              <div className="order-card-header">
                <div className="order-header-info">
                  <div className="order-id-group">
                    <span className="order-label">Order #</span>
                    <span className="order-id-text">{order._id}</span>
                  </div>
                  <div className="order-date-group">
                    <Calendar size={14} className="text-muted" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                <div className="order-status-group">
                  <span className={`status-badge ${order.status?.toLowerCase()}`}>
                    {order.status || 'PLACED'}
                  </span>
                  <span className={`status-badge ${order.paymentStatus?.toLowerCase()}`}>
                    {order.paymentStatus || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="order-card-body">
                <div className="order-card-items">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="order-summary-item-row">
                      <div className="item-thumb-wrapper">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <div className="thumb-placeholder" />
                        )}
                      </div>
                      <div className="item-details-wrapper">
                        <span className="item-name-heading">{item.name}</span>
                        <span className="item-qty-meta">
                          Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="item-line-total">
                        ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping & Delivery Address Snapshot */}
                {order.shippingAddress && (
                  <div className="order-shipping-summary">
                    <div className="shipping-label-row">
                      <MapPin size={14} className="text-indigo-400" />
                      <span>Shipping Address:</span>
                    </div>
                    <p className="shipping-text">
                      <strong>{order.shippingAddress.fullName}</strong> •{' '}
                      {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
                      {order.shippingAddress.state} - {order.shippingAddress.pincode} (
                      {order.shippingAddress.phone})
                    </p>
                  </div>
                )}
              </div>

              {/* Order Card Footer */}
              <div className="order-card-footer">
                <div className="order-total-block">
                  <span className="total-label">Total Amount</span>
                  <span className="total-amount-val">
                    ₹{order.totalAmount?.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Bonus: Status Progression Controls for demo */}
                <div className="order-bonus-controls">
                  <span className="bonus-label">Update Status:</span>
                  <select
                    className="status-select-control"
                    value={order.status || 'PLACED'}
                    disabled={updatingId === order._id}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  >
                    <option value="PLACED">PLACED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
