import React from 'react';

/**
 * Standing reusable medicine classification badge
 * @param {object} props
 * @param {string} props.rxType - Medicine rxType classification ('OTC', 'H', 'NRX', 'H1')
 * @param {string} [props.className] - Optional container style extensions
 */
export default function RxBadge({ rxType, className = '' }) {
  if (!rxType) return null;
  
  const type = rxType.toUpperCase();

  switch (type) {
    case 'H1':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200 ${className}`}>
          Schedule H1
        </span>
      );
    case 'H':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
          Prescription Required
        </span>
      );
    case 'NRX':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
          Store Approval Required
        </span>
      );
    case 'OTC':
    default:
      // OTC renders nothing
      return null;
  }
}
