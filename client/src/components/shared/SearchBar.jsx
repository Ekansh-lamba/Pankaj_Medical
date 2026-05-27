import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import api from '../../services/api';
import RxBadge from './RxBadge';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Navbar autocomplete search suggestions bar
 */
export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions when debounced query reaches min 2 chars
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await api.get('/api/products/search', {
          params: { q: debouncedQuery, suggest: true }
        });
        if (response.data && response.data.success) {
          setSuggestions(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching search suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Click outside detector to close suggestions drawer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setShowDropdown(false);
      navigate(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (slug) => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    navigate(`/products/${slug}`);
  };

  return (
    <div ref={dropdownRef} className="relative w-full max-w-sm md:max-w-md">
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search medicines or composition salts..."
          className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400"
        />
        
        {/* Search Icon */}
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        
        {/* Loading Spinner */}
        {loading && (
          <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-primary-600 animate-spin" />
        )}
      </form>

      {/* Suggestions Autocomplete Dropdown */}
      {showDropdown && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50 divide-y divide-gray-100">
          {loading && suggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" /> Searching...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((item) => (
              <div
                key={item.slug}
                onClick={() => handleSuggestionClick(item.slug)}
                className="p-3 hover:bg-primary-50/50 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div className="flex flex-col pr-4">
                  <span className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                    {item.brand} &bull; {item.form}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <RxBadge rxType={item.rxType} />
                  <span className="text-xs font-bold text-primary-600">
                    {formatCurrency(item.sellingPrice)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">
              No matching medicines found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
