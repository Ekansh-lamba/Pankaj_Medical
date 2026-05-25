import React, { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const categoriesList = [
  'Tablets & Capsules', 'Syrups & Liquids', 'Injections',
  'Surgical & Devices', 'Vitamins & Supplements',
  'Baby Care', 'Personal Care', 'Ayurvedic & Herbal'
];

const topBrands = [
  'Cadila', 'Alkem', 'Pfizer', 'Abbott', 'Cipla',
  'Sun Pharma', 'Lupin', 'Dabur', 'Himalaya', 'Glenmark'
];

/**
 * Mobile-collapsible, premium styled left filter sidebar
 * @param {object} props
 * @param {object} props.filters - Active filter state
 * @param {function} props.setFilters - Callback to update filters
 */
export default function FilterSidebar({ filters, setFilters }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryChange = (cat) => {
    // If already selected, clear it, else set it (exclusive single select or multi)
    // Per spec: category exact match, let's keep it simple as single select or toggle
    if (filters.category === cat) {
      setFilters({ category: '' });
    } else {
      setFilters({ category: cat });
    }
  };

  const handleBrandChange = (brand) => {
    if (filters.brand === brand) {
      setFilters({ brand: '' });
    } else {
      setFilters({ brand });
    }
  };

  const handlePriceChange = (field, val) => {
    const numVal = val === '' ? '' : parseFloat(val);
    setFilters({ [field]: numVal });
  };

  const handleToggleChange = (field) => {
    setFilters({ [field]: !filters[field] });
  };

  const handleRxTypeToggle = () => {
    // If it's currently OTC, clear it, else set it to OTC
    if (filters.rxType === 'OTC') {
      setFilters({ rxType: '' });
    } else {
      setFilters({ rxType: 'OTC' });
    }
  };

  const handleClearAll = () => {
    setFilters({
      category: '',
      brand: '',
      rxType: '',
      inStock: false,
      minPrice: '',
      maxPrice: '',
      q: ''
    });
  };

  const renderFiltersContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <h3 className="text-sm font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
          <SlidersHorizontal className="w-4 h-4 text-teal-600" /> Filters
        </h3>
        <button
          onClick={handleClearAll}
          className="text-xs text-teal-600 hover:text-teal-800 font-semibold transition-colors hover:underline"
        >
          Clear All
        </button>
      </div>

      {/* Category List */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Category</h4>
        <div className="space-y-2">
          {categoriesList.map((cat) => (
            <label key={cat} className="flex items-center text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.category === cat}
                onChange={() => handleCategoryChange(cat)}
                className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300 mr-2.5 transition-colors"
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      {/* Pricing Fields */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Price Range</h4>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-2.5 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              value={filters.minPrice || ''}
              onChange={(e) => handlePriceChange('minPrice', e.target.value)}
              placeholder="Min"
              className="w-full pl-6 pr-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <span className="text-gray-400 text-xs">to</span>
          <div className="flex-1 relative">
            <span className="absolute left-2.5 top-2.5 text-gray-400 text-sm">₹</span>
            <input
              type="number"
              value={filters.maxPrice || ''}
              onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
              placeholder="Max"
              className="w-full pl-6 pr-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Brands List */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Brands</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {topBrands.map((brand) => (
            <label key={brand} className="flex items-center text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filters.brand === brand}
                onChange={() => handleBrandChange(brand)}
                className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300 mr-2.5 transition-colors"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      {/* Toggle Controls */}
      <div className="pt-2 space-y-3">
        <label className="flex items-center text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.rxType === 'OTC'}
            onChange={handleRxTypeToggle}
            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300 mr-2.5 transition-colors"
          />
          OTC Medicines Only
        </label>
        <label className="flex items-center text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.inStock === true}
            onChange={() => handleToggleChange('inStock')}
            className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300 mr-2.5 transition-colors"
          />
          In Stock Only
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="md:hidden flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3.5 mb-4 shadow-sm">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:text-teal-900 focus:outline-none"
        >
          <SlidersHorizontal className="w-4 h-4 text-teal-600" /> Filter Medicines
        </button>
        {filters.category || filters.brand || filters.rxType || filters.inStock || filters.minPrice || filters.maxPrice ? (
          <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-bold">
            Active Filters
          </span>
        ) : null}
      </div>

      {/* Mobile Slide-out Drawer Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"></div>
          
          {/* Drawer container */}
          <div className="relative w-80 max-w-sm bg-white h-full flex flex-col p-6 shadow-xl overflow-y-auto animate-in slide-in-from-left duration-250">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
            {renderFiltersContent()}
          </div>
        </div>
      )}

      {/* Desktop Permanent left Sidebar */}
      <div className="hidden md:block w-64 shrink-0 bg-white border border-gray-200 rounded-xl p-6 shadow-sm self-start">
        {renderFiltersContent()}
      </div>
    </>
  );
}
