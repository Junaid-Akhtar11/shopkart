import React, { useState, useEffect, useCallback } from 'react';
import { getProducts, getCategories, getWishlist } from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import {
  Sparkles,
  AlertCircle,
  PackageX,
  RotateCw,
} from 'lucide-react';

/**
 * Products Page (with Wishlist Integration for Lab 04)
 * Features:
 *  - Dynamic product catalog fetched from GET /products
 *  - Real-time search by product name (?search=...)
 *  - Category filter dropdown (?category=...)
 *  - Price & Newest sorting (?sort=...)
 *  - Full Loading, Error, and Empty state handling
 *  - Syncs wishlist state with backend
 */
export default function Products({ user, onWishlistCountChange }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    'Electronics',
    'Fashion',
    'Books',
    'Home',
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('newest');

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch user's wishlist IDs if authenticated to reflect saved state on cards
  useEffect(() => {
    if (user) {
      getWishlist()
        .then((data) => {
          if (data && data.wishlist && Array.isArray(data.wishlist)) {
            setWishlistIds(new Set(data.wishlist.map((item) => item._id)));
          }
        })
        .catch(() => {
          // ignore if unauthenticated or error
        });
    } else {
      setWishlistIds(new Set());
    }
  }, [user]);

  // Fetch available categories once on mount
  useEffect(() => {
    let isMounted = true;
    getCategories()
      .then((res) => {
        if (isMounted && res.categories && res.categories.length > 0) {
          setCategories((prev) =>
            Array.from(new Set([...prev, ...res.categories]))
          );
        }
      })
      .catch((err) => {
        console.warn('Could not fetch distinct categories:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch products from backend GET /products
  const fetchProductsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts({
        search: debouncedSearch,
        category: selectedCategory,
        sort: selectedSort,
      });

      if (data && data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      } else if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Something went wrong while loading products.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, selectedSort]);

  useEffect(() => {
    fetchProductsList();
  }, [fetchProductsList]);

  // Handle wishlist card callback
  const handleWishlistChange = (productId, isSaved) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.add(productId);
      else next.delete(productId);
      return next;
    });
    if (onWishlistCountChange) {
      onWishlistCountChange();
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setSelectedSort('newest');
  };

  return (
    <div className="products-page-container">
      {/* Header Banner */}
      <section className="catalog-hero-section">
        <div className="catalog-hero-content">
          <div className="hero-pill-badge">
            <Sparkles size={14} />
            <span>Curated ShopKart Collection</span>
          </div>
          <h1 className="catalog-title">
            Discover <span className="text-gradient">Premium Products</span>
          </h1>
          <p className="catalog-subtitle">
            Explore high-performance electronics, modern fashion apparel, timeless books,
            and home essentials. Save your favourites to your personal Wishlist.
          </p>
        </div>
      </section>

      {/* Search & Filter UI */}
      <div className="catalog-content-wrapper">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          categories={categories}
          onResetFilters={handleResetFilters}
          totalCount={products.length}
        />

        {/* State 1: Loading State */}
        {loading && (
          <div
            className="state-container loading-state"
            id="loading-state"
            data-testid="loading-state"
          >
            <div className="state-card">
              <div className="spinner large" />
              <h3 className="state-title">Loading products...</h3>
              <p className="state-description">
                Fetching fresh inventory from the ShopKart catalogue API...
              </p>
            </div>
          </div>
        )}

        {/* State 2: Error State */}
        {!loading && error && (
          <div
            className="state-container error-state"
            id="error-state"
            data-testid="error-state"
          >
            <div className="state-card error-card">
              <div className="state-icon-badge error-badge">
                <AlertCircle size={32} />
              </div>
              <h3 className="state-title">{error}</h3>
              <p className="state-description">
                Unable to retrieve products from the server. Please verify the backend connection.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={fetchProductsList}
                id="retry-fetch-btn"
              >
                <RotateCw size={16} />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}

        {/* State 3: Empty State */}
        {!loading && !error && products.length === 0 && (
          <div
            className="state-container empty-state"
            id="empty-state"
            data-testid="empty-state"
          >
            <div className="state-card empty-card">
              <div className="state-icon-badge empty-badge">
                <PackageX size={36} />
              </div>
              <h3 className="state-title">No products found.</h3>
              <p className="state-description">
                We couldn&apos;t find any items matching your active search criteria.
                Try adjusting your search terms or clearing selected category filters.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetFilters}
                id="empty-reset-filters-btn"
              >
                <span>Clear All Filters</span>
              </button>
            </div>
          </div>
        )}

        {/* Success Grid Render */}
        {!loading && !error && products.length > 0 && (
          <div
            className="products-grid"
            id="products-grid"
            data-testid="products-grid"
          >
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isWishlisted={wishlistIds.has(product._id)}
                onWishlistChange={handleWishlistChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
