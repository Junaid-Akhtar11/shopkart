import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentCustomer } from '../services/api';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Package,
  Heart,
  CreditCard,
  Sparkles,
  CheckCircle,
  KeyRound,
  ChevronRight
} from 'lucide-react';

export default function Home({ onUserLoaded }) {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCustomerProfile = async () => {
      try {
        setLoading(true);
        // API call: GET /customers/me
        // withCredentials: true sends the HttpOnly cookie automatically
        const data = await getCurrentCustomer();
        if (isMounted) {
          setCustomer(data);
          if (onUserLoaded) {
            onUserLoaded(data);
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setLoading(false);
          // If Not Logged In (401 Unauthorized or missing cookie), redirect to /login
          navigate('/login', {
            replace: true,
            state: { serverMessage: 'Please sign in to view your dashboard.' },
          });
        }
      }
    };

    fetchCustomerProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate, onUserLoaded]);

  // Loading skeleton state
  if (loading) {
    return (
      <div className="dashboard-loading-container">
        <div className="loading-card">
          <div className="spinner large" />
          <h3 className="loading-title">Verifying Customer Session...</h3>
          <p className="loading-subtitle">
            Authenticating with ShopKart API via HttpOnly cookie
          </p>
        </div>
      </div>
    );
  }

  // If customer is not yet loaded or redirected
  if (!customer) {
    return null;
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="dashboard-page-container">
      <div className="dashboard-container">
        {/* Top Hero Banner */}
        <section className="dashboard-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} />
              <span>ShopKart Premium Member</span>
            </div>
            {/* Welcome message required by Task 3 */}
            <h1 className="hero-heading" id="welcome-message">
              Welcome back, <span className="text-gradient">{customer.fullName}</span>!
            </h1>
            <p className="hero-subtext">
              Here is your account overview and recent ShopKart activity. All data is securely
              loaded directly from the <code className="code-pill">GET /customers/me</code> API.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                id="hero-go-to-products-btn"
                onClick={() => navigate('/products')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.85rem 1.6rem',
                  fontSize: '0.98rem',
                  fontWeight: '700',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                }}
              >
                <ShoppingBag size={20} />
                <span>Explore Products Catalog (Lab 03)</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="hero-stat-cards">
            <div className="stat-card">
              <div className="stat-icon-wrapper bg-indigo">
                <ShoppingBag size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">ShopKart Plus</span>
                <span className="stat-label">Membership Tier</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper bg-emerald">
                <ShieldCheck size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-value">Authenticated</span>
                <span className="stat-label">HttpOnly Cookie</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid: Customer Details + Quick Actions */}
        <div className="dashboard-grid">
          {/* Left Column: Customer Profile Details Card */}
          <section className="dashboard-card profile-details-card" id="customer-profile-card">
            <div className="card-header-row">
              <div className="card-title-group">
                <h2 className="card-title">Customer Information</h2>
                <p className="card-subtitle">Verified customer account details</p>
              </div>
              <span className="status-pill status-pill-success">
                <CheckCircle size={14} /> Active
              </span>
            </div>

            <div className="profile-hero-block">
              <div className="profile-large-avatar">
                {getInitials(customer.fullName)}
              </div>
              <div className="profile-large-info">
                {/* Customer Name required by Task 3 */}
                <h3 className="profile-full-name" id="customer-name">
                  {customer.fullName}
                </h3>
                <span className="profile-customer-id">
                  ID: <code>{customer._id || 'Verified'}</code>
                </span>
              </div>
            </div>

            <div className="profile-info-list">
              {/* Full Name */}
              <div className="info-row">
                <div className="info-label-group">
                  <User size={18} className="info-icon" />
                  <span className="info-label">Full Name</span>
                </div>
                <span className="info-value font-medium">{customer.fullName}</span>
              </div>

              {/* Email Address */}
              <div className="info-row">
                <div className="info-label-group">
                  <Mail size={18} className="info-icon" />
                  <span className="info-label">Email Address</span>
                </div>
                {/* Email required by Task 3 */}
                <span className="info-value font-mono" id="customer-email">
                  {customer.email}
                </span>
              </div>

              {/* Phone Number */}
              <div className="info-row">
                <div className="info-label-group">
                  <Phone size={18} className="info-icon" />
                  <span className="info-label">Phone Number</span>
                </div>
                {/* Phone number required by Task 3 */}
                <span className="info-value font-mono" id="customer-phone">
                  {customer.phone}
                </span>
              </div>

              {/* Security Status */}
              <div className="info-row">
                <div className="info-label-group">
                  <ShieldCheck size={18} className="info-icon" />
                  <span className="info-label">Auth Method</span>
                </div>
                <span className="info-value text-success font-medium">
                  JWT in HttpOnly Cookie
                </span>
              </div>
            </div>

            <div className="profile-security-callout">
              <div className="callout-icon">
                <KeyRound size={20} />
              </div>
              <div className="callout-text">
                <h4>Protected Route Verified</h4>
                <p>
                  This session is strictly verified by the server backend. If the HttpOnly cookie
                  is invalid, expired, or missing, users are automatically redirected to <code>/login</code>.
                </p>
              </div>
            </div>
          </section>

          {/* Right Column: E-Commerce Dashboard & Overview Cards */}
          <div className="dashboard-side-column">
            {/* Quick Metrics */}
            <div className="metrics-grid">
              <div className="metric-box">
                <div className="metric-header">
                  <Package size={20} className="text-indigo" />
                  <span className="metric-tag">Orders</span>
                </div>
                <div className="metric-number">3</div>
                <div className="metric-caption">Recent Deliveries</div>
              </div>

              <div className="metric-box">
                <div className="metric-header">
                  <Heart size={20} className="text-rose" />
                  <span className="metric-tag">Wishlist</span>
                </div>
                <div className="metric-number">12</div>
                <div className="metric-caption">Saved Items</div>
              </div>

              <div className="metric-box">
                <div className="metric-header">
                  <CreditCard size={20} className="text-amber" />
                  <span className="metric-tag">Wallet</span>
                </div>
                <div className="metric-number">₹2,450</div>
                <div className="metric-caption">Reward Balance</div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="dashboard-card recent-orders-card">
              <div className="card-header-row">
                <div className="card-title-group">
                  <h3 className="card-title">Recent Orders</h3>
                  <p className="card-subtitle">ShopKart purchases and tracking</p>
                </div>
                <span className="badge-pill">3 Items</span>
              </div>

              <div className="orders-list">
                <div className="order-item">
                  <div className="order-product-badge">
                    <Package size={18} />
                  </div>
                  <div className="order-info">
                    <span className="order-title">Sony WH-1000XM5 Wireless Headphones</span>
                    <span className="order-meta">Order #SK-88219 • ₹26,990 • Delivered</span>
                  </div>
                  <span className="status-pill status-pill-success">Delivered</span>
                </div>

                <div className="order-item">
                  <div className="order-product-badge">
                    <Package size={18} />
                  </div>
                  <div className="order-info">
                    <span className="order-title">Mechanical Gaming Keyboard RGB</span>
                    <span className="order-meta">Order #SK-88102 • ₹4,499 • In Transit</span>
                  </div>
                  <span className="status-pill status-pill-warning">In Transit</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="dashboard-card quick-actions-card">
              <h3 className="card-title">ShopKart Services</h3>
              <div className="action-links-grid">
                <div
                  className="action-tile clickable"
                  id="explore-store-tile"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/products')}
                  onKeyDown={(e) => e.key === 'Enter' && navigate('/products')}
                >
                  <ShoppingBag size={22} className="text-indigo" />
                  <div className="action-tile-text">
                    <span className="action-name">Explore Store</span>
                    <span className="action-desc">Browse trending deals</span>
                  </div>
                  <ChevronRight size={18} className="action-arrow" />
                </div>

                <div className="action-tile">
                  <ShieldCheck size={22} className="text-emerald" />
                  <div className="action-tile-text">
                    <span className="action-name">Security & Privacy</span>
                    <span className="action-desc">Review connected devices</span>
                  </div>
                  <ChevronRight size={18} className="action-arrow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
