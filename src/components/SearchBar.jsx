import React from 'react';
import { Search, Filter, ArrowUpDown, X, Sparkles } from 'lucide-react';

/**
 * Task 7: SearchBar & Filters Component
 * Provides:
 *  - Search input with live debounced querying
 *  - Category selection dropdown
 *  - Bonus: Sort by price ascending / descending / newest
 *  - Quick reset button when filters are active
 */
export default function SearchBar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSort,
  onSortChange,
  categories = [],
  onResetFilters,
  totalCount = 0,
}) {
  const isFiltered = Boolean(
    searchTerm.trim() ||
    (selectedCategory && selectedCategory !== 'All') ||
    (selectedSort && selectedSort !== 'newest')
  );

  return (
    <section className="search-filter-section" aria-label="Product Search and Filters">
      <div className="search-filter-container">
        {/* Search Input Bar */}
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            id="product-search-input"
            className="search-input"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search products"
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters and Sorting Controls */}
        <div className="filter-controls-group">
          {/* Category Dropdown */}
          <div className="select-wrapper">
            <Filter size={16} className="select-icon" />
            <select
              id="category-filter-select"
              className="filter-select"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Bonus Challenge: Sort Dropdown */}
          <div className="select-wrapper">
            <ArrowUpDown size={16} className="select-icon" />
            <select
              id="sort-select"
              className="filter-select"
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort products"
            >
              <option value="newest">Featured / Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              type="button"
              id="reset-filters-btn"
              className="btn btn-secondary btn-reset"
              onClick={onResetFilters}
              title="Clear all filters"
            >
              <X size={15} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      <div className="filter-meta-bar">
        <div className="results-count">
          <Sparkles size={14} className="text-accent" />
          <span>
            Showing <strong>{totalCount}</strong> product{totalCount === 1 ? '' : 's'}
          </span>
        </div>

        {isFiltered && (
          <div className="active-tags-list">
            {searchTerm && (
              <span className="filter-pill-tag">
                Query: &ldquo;{searchTerm}&rdquo;
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Remove search query filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedCategory && selectedCategory !== 'All' && (
              <span className="filter-pill-tag">
                Category: {selectedCategory}
                <button
                  type="button"
                  onClick={() => onCategoryChange('All')}
                  aria-label="Remove category filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedSort && selectedSort !== 'newest' && (
              <span className="filter-pill-tag">
                Sort: {selectedSort === 'price_asc' ? 'Price ↑' : 'Price ↓'}
                <button
                  type="button"
                  onClick={() => onSortChange('newest')}
                  aria-label="Reset sort"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
