import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom React hook to manage product listing state, pagination, sorting, and filtering
 * @param {object} initialFilters - Optional initial filter overrides
 * @returns {object} useProducts state exposure
 */
export function useProducts(initialFilters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Default values: 12 items limit for listing grid
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  
  const [filters, setFiltersState] = useState({
    category: '',
    brand: '',
    rxType: '',
    inStock: false,
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest',
    q: '',
    ...initialFilters
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };

      // Scrub empty or default filters to keep URL/queries clean
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      if (params.inStock === false) {
        delete params.inStock;
      }

      // Choose endpoint dynamically based on text query vs standard catalog list
      let endpoint = '/api/products';
      if (params.q) {
        endpoint = '/api/products/search';
      }

      const response = await api.get(endpoint, { params });
      
      if (response.data && response.data.success) {
        if (params.q) {
          // searchProducts API returns array direct in data
          const results = response.data.data;
          setProducts(results);
          setPagination({ page: 1, limit: 20, total: results.length, pages: 1 });
        } else {
          // getProducts API returns { products, pagination }
          const { products: list, pagination: pag } = response.data.data;
          setProducts(list);
          setPagination(pag);
        }
      }
    } catch (err) {
      console.error('Failed to query products from API:', err);
      setError(err.response?.data?.message || 'An error occurred while loading products.');
    } finally {
      setLoading(false);
    }
  }, [page, filters, pagination.limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const setFilters = (newFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Force reset page count on new filter boundaries
  };

  return {
    products,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    setPage,
    refetch: fetchProducts
  };
}
