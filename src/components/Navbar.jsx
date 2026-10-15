import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, LogOut, User, Menu, X, ShieldCheck, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Navbar({ user, wishlistCount = 0, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnits } = useCart();

  const handleLogoutClick = async () => {
    try {
      setIsLoggingOut(true);
      if (onLogout) {
        await onLogout();
      }
    } finally {
      setIsLoggingOut(false);
      setMobileMenuOpen(false);
      navigate('/login');
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Helper to extract customer initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isProductsActive =
    location.pathname === '/products' || location.pathname.startsWith('/products/');
  const isWishlistActive = location.pathname === '/wishlist';
  const isCartActive = location.pathname === '/cart';
  const isHomeActive = location.pathname === '/home';

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand Logo */}
        <Link to="/products" className="navbar-brand" onClick={closeMobileMenu}>
          <div className="brand-icon-wrapper">
            <ShoppingBag className="brand-icon" size={24} />
          </div>
          <div className="brand-text-group">
            <span className="brand-title">ShopKart</span>
            <span className="brand-badge">Cart & Shop</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <Link
            to="/products"
            className={`nav-link ${isProductsActive ? 'active' : ''}`}
            id="nav-products-link"
          >
            Products
          </Link>

          {/* Wishlist Link with dynamic backend count */}
          <Link
            to="/wishlist"
            className={`nav-link nav-wishlist-link ${isWishlistActive ? 'active' : ''}`}
            id="nav-wishlist-link"
          >
            <Heart size={16} className={`inline-icon ${wishlistCount > 0 ? 'text-rose-500 fill-current' : ''}`} />
            <span>Wishlist</span>
            {user && (
              <span className="navbar-count-badge" id="nav-wishlist-count">
                ({wishlistCount})
              </span>
            )}
          </Link>

          {/* Lab 05 - Task 16: Navbar Cart Link with total quantity count */}
          <Link
            to="/cart"
            className={`nav-link nav-cart-link ${isCartActive ? 'active' : ''}`}
            id="nav-cart-link"
          >
            <ShoppingCart size={16} className={`inline-icon ${totalUnits > 0 ? 'text-indigo-400' : ''}`} />
            <span>Cart</span>
            {user && (
              <span className="navbar-count-badge cart-badge" id="nav-cart-count">
                ({totalUnits})
              </span>
            )}
          </Link>

          {user ? (
            <div className="nav-auth-section">
              <Link
                to="/orders"
                className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}
                id="nav-orders-link"
              >
                My Orders
              </Link>
              <Link
                to="/home"
                className={`nav-link ${isHomeActive ? 'active' : ''}`}
                id="nav-home-link"
              >
                Dashboard
              </Link>
              <div className="user-profile-badge">
                <div className="user-avatar">{getInitials(user.fullName)}</div>
                <div className="user-info-text">
                  <span className="user-name">{user.fullName || 'Customer'}</span>
                  <span className="user-role">
                    <ShieldCheck size={12} className="inline-icon" /> Verified
                  </span>
                </div>
              </div>
              <button
                type="button"
                id="logout-button"
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="btn btn-logout"
                title="Log out of your account"
              >
                <LogOut size={16} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          ) : (
            <div className="nav-guest-section">
              <Link
                to="/login"
                className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                id="nav-login-link"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm"
                id="nav-register-link"
              >
                <User size={16} />
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          {user ? (
            <>
              <div className="mobile-user-card">
                <div className="user-avatar large">{getInitials(user.fullName)}</div>
                <div className="mobile-user-details">
                  <p className="user-name">{user.fullName}</p>
                  <p className="user-email">{user.email}</p>
                  <span className="user-role badge-pill">Verified Customer</span>
                </div>
              </div>
              <Link
                to="/products"
                className={`mobile-nav-link ${isProductsActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Products Catalog
              </Link>
              <Link
                to="/wishlist"
                className={`mobile-nav-link ${isWishlistActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
                id="mobile-nav-wishlist-link"
              >
                Wishlist ({wishlistCount})
              </Link>
              <Link
                to="/cart"
                className={`mobile-nav-link ${isCartActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
                id="mobile-nav-cart-link"
              >
                Cart ({totalUnits})
              </Link>
              <Link
                to="/orders"
                className={`mobile-nav-link ${location.pathname === '/orders' ? 'active' : ''}`}
                onClick={closeMobileMenu}
                id="mobile-nav-orders-link"
              >
                My Orders
              </Link>
              <Link
                to="/home"
                className={`mobile-nav-link ${isHomeActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>
              <button
                type="button"
                id="mobile-logout-button"
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="btn btn-logout full-width"
              >
                <LogOut size={16} />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </>
          ) : (
            <div className="mobile-guest-links">
              <Link
                to="/products"
                className={`mobile-nav-link ${isProductsActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Products Catalog
              </Link>
              <Link
                to="/wishlist"
                className={`mobile-nav-link ${isWishlistActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Wishlist
              </Link>
              <Link
                to="/cart"
                className={`mobile-nav-link ${isCartActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Cart ({totalUnits})
              </Link>
              <Link
                to="/login"
                className={`mobile-nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary full-width"
                onClick={closeMobileMenu}
              >
                <User size={16} />
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
