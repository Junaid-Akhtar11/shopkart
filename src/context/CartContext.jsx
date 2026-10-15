import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getCart, addToCart as apiAddToCart, updateCartQuantity as apiUpdateCartQuantity, removeFromCart as apiRemoveFromCart, getErrorMessage } from '../services/api';

const CartContext = createContext(null);

/**
 * Global Cart Provider
 * Manages cartItems, loading states, error states, and operations.
 * Exposes derived values: totalUnits (cart count), subtotal, and distinct item count.
 */
export function CartProvider({ children, user }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Item-level operation loading state: map of productId -> boolean/action
  const [itemActionLoading, setItemActionLoading] = useState({});

  /**
   * Refreshes the cart from the backend.
   * If user is unauthenticated, clears the cart.
   */
  const refreshCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getCart();
      if (data && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
      // If 401, cart is empty
      if (err.response?.status === 401) {
        setCartItems([]);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Sync cart when user authentication status changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  /**
   * Add a product to the cart (or increment its quantity)
   */
  const addItemToCart = useCallback(async (productId) => {
    setItemActionLoading((prev) => ({ ...prev, [productId]: 'adding' }));
    setError(null);
    try {
      const data = await apiAddToCart(productId);
      if (data && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      } else {
        await refreshCart();
      }
      return { success: true, message: data.message || 'Added to cart' };
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setItemActionLoading((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  }, [refreshCart]);

  /**
   * Update quantity of an existing cart item
   */
  const updateQuantity = useCallback(async (productId, quantity) => {
    setItemActionLoading((prev) => ({ ...prev, [productId]: 'updating' }));
    setError(null);
    try {
      const data = await apiUpdateCartQuantity(productId, quantity);
      if (data && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      } else {
        await refreshCart();
      }
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setItemActionLoading((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  }, [refreshCart]);

  /**
   * Remove a product completely from the cart
   */
  const removeItemFromCart = useCallback(async (productId) => {
    setItemActionLoading((prev) => ({ ...prev, [productId]: 'removing' }));
    setError(null);
    try {
      const data = await apiRemoveFromCart(productId);
      if (data && Array.isArray(data.cart)) {
        setCartItems(data.cart);
      } else {
        await refreshCart();
      }
      return { success: true };
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setItemActionLoading((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  }, [refreshCart]);

  /**
   * Derived Values:
   * 1. totalUnits (Navbar cart count: sum of all item quantities)
   * 2. subtotal: sum of (product.price * quantity)
   * 3. itemCount: number of distinct items in cart
   */
  const totalUnits = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = item.product?.price ? Number(item.product.price) : 0;
      const qty = Number(item.quantity) || 0;
      return sum + price * qty;
    }, 0);
  }, [cartItems]);

  const itemCount = useMemo(() => {
    return cartItems.length;
  }, [cartItems]);

  const isProductInCart = useCallback((productId) => {
    return cartItems.some(
      (item) => item.product && (item.product._id === productId || item.product === productId)
    );
  }, [cartItems]);

  const getProductCartQuantity = useCallback((productId) => {
    const found = cartItems.find(
      (item) => item.product && (item.product._id === productId || item.product === productId)
    );
    return found ? found.quantity : 0;
  }, [cartItems]);

  /**
   * Clears the cart locally (invoked after successful verified payment)
   */
  const clearCart = useCallback(() => {
    setCartItems([]);
    setError(null);
  }, []);

  const value = {
    cartItems,
    isLoading,
    error,
    totalUnits,
    subtotal,
    itemCount,
    itemActionLoading,
    refreshCart,
    clearCart,
    addItemToCart,
    updateQuantity,
    removeItemFromCart,
    isProductInCart,
    getProductCartQuantity,
    clearError: () => setError(null),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
