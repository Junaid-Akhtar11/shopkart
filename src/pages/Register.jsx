import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerCustomer, getErrorMessage } from '../services/api';
import { User, Mail, Lock, Phone, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  // Controlled component state for form inputs
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle controlled input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  // Client-side validation logic
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{7,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (7-15 digits)';
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
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      };

      await registerCustomer(payload);

      // On success -> Redirect to Login page with notification state
      navigate('/login', {
        state: {
          registeredEmail: formData.email.trim(),
          successMessage: 'Account created successfully! Please sign in with your credentials.',
        },
      });
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setServerError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-layout-grid">
        {/* Left Side: Brand Value Proposition & Visual Elements */}
        <div className="auth-brand-side">
          <div className="brand-badge-pill">
            <ShoppingBag size={16} />
            <span>ShopKart Customer Ecosystem</span>
          </div>

          <h1 className="auth-hero-heading">
            Join Millions of Happy <span className="text-gradient">ShopKart</span> Shoppers.
          </h1>

          <p className="auth-hero-description">
            Create an account to unlock express checkout, personalized product recommendations,
            real-time tracking, and exclusive member-only flash discounts.
          </p>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon-box">
                <CheckCircle2 size={18} className="text-success" />
              </div>
              <div>
                <h4>Seamless HttpOnly Cookie Security</h4>
                <p>Industry-grade token protection against XSS and CSRF threats.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <CheckCircle2 size={18} className="text-success" />
              </div>
              <div>
                <h4>Zero-Latency Profile Synchronization</h4>
                <p>Instant access across devices with single-session authentication.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <CheckCircle2 size={18} className="text-success" />
              </div>
              <div>
                <h4>Exclusive Customer Privileges</h4>
                <p>Early-bird access to seasonal sales, free express shipping, and easy returns.</p>
              </div>
            </div>
          </div>

          <div className="brand-trust-footer">
            <ShieldCheck size={20} className="text-primary" />
            <span>256-bit encrypted communication with ShopKart Core API</span>
          </div>
        </div>

        {/* Right Side: Registration Form Card */}
        <div className="auth-card-side">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-title">Create Account</h2>
              <p className="auth-subtitle">
                Fill in your details below to set up your ShopKart account
              </p>
            </div>

            {/* Global Server Error Banner */}
            {serverError && (
              <div className="alert alert-error" role="alert">
                <AlertCircle size={20} className="alert-icon" />
                <div className="alert-content">
                  <strong>Registration Failed</strong>
                  <span>{serverError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="auth-form">
              {/* Full Name Field */}
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Full Name <span className="required-star">*</span>
                </label>
                <div className={`input-wrapper ${errors.fullName ? 'has-error' : ''}`}>
                  <User className="input-icon" size={18} />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className="form-control"
                    autoComplete="name"
                    required
                  />
                </div>
                {errors.fullName && <span className="field-error-text">{errors.fullName}</span>}
              </div>

              {/* Email Address Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address <span className="required-star">*</span>
                </label>
                <div className={`input-wrapper ${errors.email ? 'has-error' : ''}`}>
                  <Mail className="input-icon" size={18} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. john@example.com"
                    className="form-control"
                    autoComplete="email"
                    required
                  />
                </div>
                {errors.email && <span className="field-error-text">{errors.email}</span>}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password <span className="required-star">*</span>
                </label>
                <div className={`input-wrapper ${errors.password ? 'has-error' : ''}`}>
                  <Lock className="input-icon" size={18} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    className="form-control"
                    autoComplete="new-password"
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
                {errors.password ? (
                  <span className="field-error-text">{errors.password}</span>
                ) : (
                  <span className="input-hint">Must contain at least 6 characters</span>
                )}
              </div>

              {/* Phone Number Field */}
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number <span className="required-star">*</span>
                </label>
                <div className={`input-wrapper ${errors.phone ? 'has-error' : ''}`}>
                  <Phone className="input-icon" size={18} />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className="form-control"
                    autoComplete="tel"
                    required
                  />
                </div>
                {errors.phone && <span className="field-error-text">{errors.phone}</span>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="create-account-button"
                className="btn btn-primary btn-block btn-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="button-spinner-row">
                    <span className="spinner" />
                    <span>Creating your account...</span>
                  </span>
                ) : (
                  <span className="button-label-row">
                    <span>Create Account</span>
                    <ArrowRight size={18} />
                  </span>
                )}
              </button>
            </form>

            {/* Footer Navigation Link */}
            <div className="auth-card-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="auth-link font-semibold">
                  Sign In instead
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
