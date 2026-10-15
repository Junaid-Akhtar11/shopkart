import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginCustomer, getErrorMessage } from '../services/api';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, ShoppingBag, ShieldCheck } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Controlled component state for email and password
  const [formData, setFormData] = useState(() => ({
    email: location.state?.registeredEmail || '',
    password: '',
  }));

  // UI state
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [flashSuccess] = useState(() => location.state?.successMessage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle controlled input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  // Client-side validation before dispatching to API
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
      };

      // Calls POST /customers/login (withCredentials: true sends/receives cookies)
      const data = await loginCustomer(payload);

      // Notify parent/context state of successful login
      if (onLoginSuccess && data.customer) {
        onLoginSuccess(data.customer);
      }

      // Navigate to /home on success
      navigate('/home');
    } catch (err) {
      // Show "Invalid credentials" or server message on failure
      const errorMsg = getErrorMessage(err);
      setServerError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-layout-grid">
        {/* Left Side: Brand Promo and Feature Overview */}
        <div className="auth-brand-side">
          <div className="brand-badge-pill">
            <ShoppingBag size={16} />
            <span>Welcome to ShopKart</span>
          </div>

          <h1 className="auth-hero-heading">
            Sign in to access your <span className="text-gradient">ShopKart</span> Hub.
          </h1>

          <p className="auth-hero-description">
            Safely access your saved cart, view past orders, track live deliveries, and enjoy personalized
            recommendations tailored specifically to your preferences.
          </p>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon-box">
                <ShieldCheck size={18} className="text-success" />
              </div>
              <div>
                <h4>Zero Credential Leakage</h4>
                <p>Authentication tokens are stored strictly within HttpOnly cookies.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <CheckCircle size={18} className="text-success" />
              </div>
              <div>
                <h4>Auto Protected Session</h4>
                <p>Protected routes dynamically verify sessions against the /customers/me API.</p>
              </div>
            </div>
          </div>

          <div className="quote-card">
            <p className="quote-text">
              “ShopKart’s cookie-based authentication provides a seamless and secure shopping experience
              without compromising user privacy.”
            </p>
            <div className="quote-author">
              <span className="quote-author-name">Engineering Lab 02</span>
              <span className="quote-author-title">Customer Authentication Suite</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="auth-card-side">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">
                Please enter your credentials to sign into your account
              </p>
            </div>

            {/* Flash Success Notification from Registration */}
            {flashSuccess && (
              <div className="alert alert-success" role="status">
                <CheckCircle size={20} className="alert-icon" />
                <div className="alert-content">
                  <strong>Registration Complete</strong>
                  <span>{flashSuccess}</span>
                </div>
              </div>
            )}

            {/* Server Error Alert (e.g. Invalid Credentials) */}
            {serverError && (
              <div className="alert alert-error" role="alert" id="login-error-alert">
                <AlertCircle size={20} className="alert-icon" />
                <div className="alert-content">
                  <strong>Authentication Failed</strong>
                  <span>{serverError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="auth-form">
              {/* Email Address */}
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">
                  Email Address <span className="required-star">*</span>
                </label>
                <div className={`input-wrapper ${errors.email ? 'has-error' : ''}`}>
                  <Mail className="input-icon" size={18} />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. customer@example.com"
                    className="form-control"
                    autoComplete="email"
                    required
                  />
                </div>
                {errors.email && <span className="field-error-text">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="form-group">
                <div className="label-with-aside">
                  <label htmlFor="login-password" className="form-label">
                    Password <span className="required-star">*</span>
                  </label>
                </div>
                <div className={`input-wrapper ${errors.password ? 'has-error' : ''}`}>
                  <Lock className="input-icon" size={18} />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="form-control"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="field-error-text">{errors.password}</span>}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                id="login-button"
                className="btn btn-primary btn-block btn-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="button-spinner-row">
                    <span className="spinner" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span className="button-label-row">
                    <span>Sign In to ShopKart</span>
                    <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>

            {/* Footer Navigation */}
            <div className="auth-card-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="auth-link font-semibold" id="link-to-register">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
