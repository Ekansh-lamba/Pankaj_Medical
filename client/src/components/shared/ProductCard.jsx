import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, AlertTriangle } from 'lucide-react';
import RxBadge from './RxBadge';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Standard utility to verify if an expiry Date falls in the "Expiring Soon" category (31 to 90 days from now)
 */
function checkExpiringSoon(expiryDateStr) {
  if (!expiryDateStr) return false;
  const expiry = new Date(expiryDateStr);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 30 && diffDays <= 90;
}

/**
 * Reusable medicine listing card component
 * @param {object} props
 * @param {object} props.product - Mongoose Product entity object
 */
export default function ProductCard({ product }) {
  const {
    name,
    slug,
    brand,
    form,
    mrp,
    sellingPrice,
    discount,
    rxType,
    stock,
    expiryDate,
    images
  } = product;

  const isOutOfStock = stock <= 0;
  const isExpiringSoon = checkExpiringSoon(expiryDate);
  const productImage = images && images[0] ? images[0] : '';

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group h-full">
      {/* Expiring Soon Banner Alert */}
      {isExpiringSoon && (
        <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
          <AlertTriangle className="w-3 h-3" /> Expiring Soon
        </div>
      )}

      {/* Out of Stock Overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 bg-white/70 z-20 flex flex-col items-center justify-center p-4 text-center">
          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm mb-2">
            Out of Stock
          </span>
          <Link
            to={`/products/${slug}`}
            className="text-xs font-bold text-teal-600 hover:text-teal-800 hover:underline"
          >
            See Alternatives
          </Link>
        </div>
      )}

      {/* Product Image section */}
      <Link to={`/products/${slug}`} className="block relative aspect-square bg-gray-50 flex items-center justify-center p-6 border-b border-gray-100 overflow-hidden">
        {productImage ? (
          <img
            src={productImage}
            alt={name}
            className="object-contain max-h-full max-w-full transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <svg
            className="w-16 h-16 text-gray-200 group-hover:scale-105 transition-transform duration-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
          </svg>
        )}
      </Link>

      {/* Card Info Details */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Brand Name */}
        <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider mb-1">
          {brand}
        </span>

        {/* Product Title */}
        <Link
          to={`/products/${slug}`}
          style={{ textDecoration: 'none' }}
          className="text-sm font-bold text-gray-800 hover:text-teal-600 line-clamp-2 min-h-[40px] leading-tight mb-2"
        >
          {name}
        </Link>

        {/* Sub-details (Form + RxBadge) */}
        <div className="flex items-center gap-2 mb-3 min-h-[22px]">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{form}</span>
          <RxBadge rxType={rxType} />
        </div>

        {/* Pricing Segment */}
        <div className="mt-auto pt-2 flex items-baseline justify-between gap-1.5">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-teal-800">
              {formatCurrency(sellingPrice)}
            </span>
            {discount > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(mrp)}
              </span>
            )}
          </div>
          {discount > 0 && (
            <span className="text-[10px] font-bold bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Add to Cart button (Visually disabled with tooltip) */}
        <button
          disabled
          title="Cart coming soon"
          className="mt-4 w-full btn-teal bg-teal-600/50 border-teal-600/10 cursor-not-allowed hover:bg-teal-600/50 hover:scale-100 flex items-center justify-center gap-1.5 py-2 text-xs"
        >
          <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
        </button>
      </div>
    </div>
  );
}
