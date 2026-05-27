import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, SlidersHorizontal, Loader2, ArrowRight } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import ProductCard from '../../components/shared/ProductCard';
import FilterSidebar from '../../components/shared/FilterSidebar';

// Skeleton Loader Component for cards
const ProductCardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-4 flex flex-col space-y-4 animate-pulse">
    <div className="aspect-square bg-primary-50/70 rounded-lg"></div>
    <div className="space-y-2 flex-grow">
      <div className="h-3 w-1/4 bg-primary-50/70 rounded"></div>
      <div className="h-4 w-3/4 bg-primary-50/70 rounded"></div>
      <div className="h-3 w-1/2 bg-primary-50/70 rounded"></div>
    </div>
    <div className="pt-2 flex justify-between items-center">
      <div className="h-5 w-1/3 bg-primary-50/70 rounded"></div>
      <div className="h-8 w-1/3 bg-primary-50/70 rounded"></div>
    </div>
  </div>
);

/**
 * Public Medicine Catalogue Listing view
 */
export default function ProductList() {
  const location = useLocation();
  
  // Extract search term 'q' from URL query params
  const params = new URLSearchParams(location.search);
  const searchQuery = params.get('q') || '';

  const {
    products,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    setPage
  } = useProducts();

  // Sync URL search queries to useProducts hook filters
  useEffect(() => {
    setFilters({ q: searchQuery });
  }, [searchQuery]);

  const handleSortChange = (e) => {
    setFilters({ sortBy: e.target.value });
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      setPage(pagination.page + 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <Helmet>
        <title>
          {filters.q
            ? `Search: "${filters.q}" — Pankaj Medical`
            : filters.category
            ? `${filters.category} Medicines — Pankaj Medical`
            : 'Buy Medicines Online — Pankaj Medical Kanpur'}
        </title>
        <meta
          name="description"
          content="Browse thousands of prescription and OTC medicines. Fast delivery in Kanpur. GSTIN-compliant pharmacy with genuine stock."
        />
        <link rel="canonical" href="https://pankajmedical.in/products" />
      </Helmet>
      {/* Category/Query Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-primary-900">
            {filters.q ? `Search results for "${filters.q}"` : filters.category ? filters.category : 'Browse All Medicines'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            {loading ? 'Finding matching stock...' : `${pagination.total} genuine medicines available`}
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort by:</span>
          <select
            value={filters.sortBy || 'newest'}
            onChange={handleSortChange}
            className="border border-slate-300 rounded-lg text-sm bg-white py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium text-slate-700 transition-all"
          >
            <option value="newest">Newest Additions</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Responsive left filters panel */}
        <FilterSidebar filters={filters} setFilters={setFilters} />

        {/* Product Cards Container Grid */}
        <div className="flex-1">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-2 mb-6 text-sm text-red-800 font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {loading && products.length === 0 ? (
            /* Loading Grid Skeletons */
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              {/* Loaded Grid items */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>

              {/* Load More Button */}
              {pagination.page < pagination.pages && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="btn-secondary flex items-center justify-center gap-1.5 py-2.5 px-6 font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                      </>
                    ) : (
                      <>
                        Load More Medicines <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty Illustration State */
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-1.5">No matching medicines found</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                We couldn't find any products matching your active filters. Try adjusting your price ranges, clearing composition search keywords, or showing out-of-stock items.
              </p>
              <button
                onClick={handleClearAllFilters => setFilters({
                  category: '',
                  brand: '',
                  rxType: '',
                  inStock: false,
                  minPrice: '',
                  maxPrice: '',
                  q: ''
                })}
                className="btn-primary"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
