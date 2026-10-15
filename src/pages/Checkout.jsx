import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  Truck,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createPaymentOrder, verifyPayment, getErrorMessage } from '../services/api';
import { loadRazorpayScript } from '../services/razorpay';

export default function Checkout({ user }) {
  const navigate = useNavigate();
  const { cartItems, subtotal, totalUnits, clearCart } = useCart();

  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Validation errors
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulatingModal, setSimulatingModal] = useState(null); // When testing in dev without live rzp keys

  // Redirect to login if unauthenticated
  if (!user) {
    return (
      <div className="checkout-page-container">
        <div className="cart-auth-required-card" id="checkout-auth-required">
          <div className="empty-cart-icon-circle">
            <ShoppingBag size={48} className="text-indigo-400" />
          </div>
          <h2 className="empty-cart-title">Sign in to proceed to checkout</h2>
          <p className="empty-cart-subtitle">
            Please log in or create an account to enter shipping details and complete your order.
          </p>
          <div className="empty-cart-actions">
            <Link to="/login" className="btn btn-primary">
              Sign In to ShopKart
            </Link>
            <Link to="/cart" className="btn btn-secondary">
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to cart/products if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="checkout-page-container">
        <div className="state-container empty-cart-state" id="checkout-empty-cart">
          <div className="empty-cart-icon-circle">
            <ShoppingBag size={52} className="text-indigo-400" />
          </div>
          <h2 className="empty-cart-title">Your Cart is Empty</h2>
          <p className="empty-cart-subtitle">
            There are no items in your cart to checkout. Add items before placing an order.
          </p>
          <div className="empty-cart-actions">
            <Link to="/products" className="btn btn-primary">
              <span>Browse Products</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  // Client-Side Validation
  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const cleanPhone = formData.phone.trim().replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.phone = 'Phone must contain at least 10 valid digits';
      }
    }

    if (!formData.addressLine1.trim()) {
      errors.addressLine1 = 'Address line is required';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = 'Pincode must contain exactly 6 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Payment Verification Handler
  const handlePaymentVerification = async (verifyPayload) => {
    try {
      const res = await verifyPayment(verifyPayload);
      if (res.success) {
        // Clear global cart state (Cart count updates to 0)
        clearCart();
        navigate(`/order-success/${res.order._id}`, {
          state: { order: res.order },
        });
      } else {
        setServerError(res.message || 'Payment verification failed');
      }
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
      setSimulatingModal(null);
    }
  };

  // Form Submit / Place Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setServerError('');

    try {
      // 1. Backend API Call: POST /orders/create-payment-order
      const orderData = await createPaymentOrder({
        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          addressLine1: formData.addressLine1.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
      });

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to initialize payment');
      }

      // Check if Razorpay keys are real or placeholder
      const isPlaceholderKey =
        !orderData.key ||
        orderData.key.includes('placeholder') ||
        orderData.razorpayOrderId.startsWith('order_sim_');

      if (isPlaceholderKey) {
        // Show test payment simulation modal with 1-click test payment or failure
        setSimulatingModal({
          shopKartOrderId: orderData.shopKartOrderId,
          razorpayOrderId: orderData.razorpayOrderId,
          amount: orderData.amount,
        });
        return;
      }

      // 2. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your network connection.');
      }

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ShopKart',
        description: `Order #${orderData.shopKartOrderId}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response) {
          // Do NOT trust the client! Send payment details for backend verification
          await handlePaymentVerification({
            shopKartOrderId: orderData.shopKartOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
          email: user?.email || '',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response.error);
        setServerError(
          response.error?.description || 'Payment was unsuccessful. Your cart has been preserved.'
        );
        setIsProcessing(false);
      });

      razorpayInstance.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setServerError(getErrorMessage(err));
      setIsProcessing(false);
    }
  };

  // Test simulation handler (used when real Razorpay credentials are not yet entered)
  const handleSimulatedPayment = async (status) => {
    if (!simulatingModal) return;
    if (status === 'fail') {
      setServerError('Payment cancelled / failed. Your cart remains untouched.');
      setSimulatingModal(null);
      setIsProcessing(false);
      return;
    }

    // Generate valid HMAC SHA256 simulation signature or trigger verification
    const mockPaymentId = `pay_test_${Date.now()}`;
    const trustedOrderId = simulatingModal.razorpayOrderId;

    // Use Web Crypto API or backend verification
    // Since backend verifies with crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex")
    // For test simulation without active razorpay keys, generate matching signature using placeholder key
    const secret = 'placeholder_secret_key';
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await window.crypto.subtle.sign(
      'HMAC',
      key,
      enc.encode(`${trustedOrderId}|${mockPaymentId}`)
    );
    const sigHex = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    await handlePaymentVerification({
      shopKartOrderId: simulatingModal.shopKartOrderId,
      razorpay_order_id: trustedOrderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: sigHex,
    });
  };

  return (
    <div className="checkout-page-container" id="checkout-page">
      {/* Header */}
      <div className="checkout-header-section">
        <h1 className="checkout-page-heading" id="checkout-title">
          Checkout
        </h1>
        <p className="checkout-page-subheading">
          Enter your delivery details and complete payment via Razorpay.
        </p>
      </div>

      {serverError && (
        <div className="checkout-error-banner" id="checkout-server-error">
          <AlertCircle size={20} className="text-rose-400 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Two-Column Checkout Layout */}
      <div className="checkout-layout-grid">
        {/* Left: Shipping Form */}
        <div className="checkout-form-column">
          <div className="checkout-card" id="shipping-details-card">
            <div className="checkout-card-header">
              <Truck size={20} className="text-indigo-400" />
              <h2>Shipping Details</h2>
            </div>

            <form onSubmit={handlePlaceOrder} id="checkout-shipping-form" noValidate>
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Aarav Sharma"
                  className={`form-input ${formErrors.fullName ? 'input-error' : ''}`}
                />
                {formErrors.fullName && (
                  <span className="field-error-text" id="error-fullName">
                    {formErrors.fullName}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className={`form-input ${formErrors.phone ? 'input-error' : ''}`}
                />
                {formErrors.phone && (
                  <span className="field-error-text" id="error-phone">
                    {formErrors.phone}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="addressLine1" className="form-label">
                  Delivery Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="e.g. Flat 402, Green Avenue, MG Road"
                  className={`form-input ${formErrors.addressLine1 ? 'input-error' : ''}`}
                />
                {formErrors.addressLine1 && (
                  <span className="field-error-text" id="error-addressLine1">
                    {formErrors.addressLine1}
                  </span>
                )}
              </div>

              <div className="form-row-three">
                <div className="form-group">
                  <label htmlFor="city" className="form-label">
                    City <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru"
                    className={`form-input ${formErrors.city ? 'input-error' : ''}`}
                  />
                  {formErrors.city && (
                    <span className="field-error-text" id="error-city">
                      {formErrors.city}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="state" className="form-label">
                    State <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Karnataka"
                    className={`form-input ${formErrors.state ? 'input-error' : ''}`}
                  />
                  {formErrors.state && (
                    <span className="field-error-text" id="error-state">
                      {formErrors.state}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="pincode" className="form-label">
                    Pincode <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 560001"
                    className={`form-input ${formErrors.pincode ? 'input-error' : ''}`}
                  />
                  {formErrors.pincode && (
                    <span className="field-error-text" id="error-pincode">
                      {formErrors.pincode}
                    </span>
                  )}
                </div>
              </div>

              {/* Trust Features */}
              <div className="checkout-trust-box">
                <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
                <div className="trust-box-text">
                  <strong>Razorpay Test Mode Payment</strong>
                  <p>All transactions are strictly in test mode. No real cards will be charged.</p>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Order Summary */}
        <aside className="checkout-summary-column">
          <div className="order-summary-card" id="checkout-order-summary">
            <h2 className="order-summary-title">Order Summary</h2>

            {/* List of items being checked out */}
            <div className="checkout-items-preview">
              {cartItems.map((item) => (
                <div key={item.product?._id || item._id} className="checkout-item-row">
                  <div className="checkout-item-thumb">
                    {item.product?.image ? (
                      <img src={item.product.image} alt={item.product.name} />
                    ) : (
                      <div className="thumb-placeholder" />
                    )}
                  </div>
                  <div className="checkout-item-info">
                    <span className="checkout-item-name">{item.product?.name}</span>
                    <span className="checkout-item-qty">Qty: {item.quantity}</span>
                  </div>
                  <div className="checkout-item-total">
                    ₹{((item.product?.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-summary-rows">
              <div className="summary-row">
                <span className="summary-label">Total Units</span>
                <span className="summary-val font-semibold">{totalUnits}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Shipping</span>
                <span className="summary-val text-emerald-400 font-semibold">FREE</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">GST / Taxes</span>
                <span className="summary-val text-muted">Included</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-row summary-total-row">
                <span className="summary-total-label">Total to Pay</span>
                <span className="summary-total-amount" id="checkout-total-amount">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              form="checkout-shipping-form"
              disabled={isProcessing}
              id="place-order-btn"
              className="btn btn-primary btn-checkout full-width"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="spinning" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>Place Order • Pay with Razorpay</span>
                </>
              )}
            </button>

            <Link to="/cart" className="btn btn-ghost full-width text-center">
              ← Return to Cart
            </Link>
          </div>
        </aside>
      </div>

      {/* Test Simulation Modal (fallback when live test keys are not yet entered) */}
      {simulatingModal && (
        <div className="simulation-modal-overlay">
          <div className="simulation-modal-card">
            <div className="modal-header">
              <div className="modal-icon-badge">
                <CreditCard size={28} className="text-indigo-400" />
              </div>
              <h3>Razorpay Test Checkout Simulator</h3>
              <p>Simulating Razorpay Standard Modal with test credentials</p>
            </div>
            <div className="simulation-details">
              <div className="sim-row">
                <span>ShopKart Order ID:</span>
                <strong>{simulatingModal.shopKartOrderId}</strong>
              </div>
              <div className="sim-row">
                <span>Amount:</span>
                <strong>₹{(simulatingModal.amount / 100).toLocaleString('en-IN')}</strong>
              </div>
              <div className="sim-row">
                <span>Mode:</span>
                <span className="test-badge">Razorpay Test Mode</span>
              </div>
            </div>
            <p className="sim-notice">
              Click below to simulate a successful payment callback or trigger a simulated payment failure.
            </p>
            <div className="modal-action-buttons">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSimulatedPayment('success')}
              >
                <CheckCircle2 size={18} />
                <span>Simulate Successful Payment</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary text-rose-400"
                onClick={() => handleSimulatedPayment('fail')}
              >
                Simulate Payment Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
