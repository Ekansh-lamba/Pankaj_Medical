/**
 * Format raw numbers into standard Indian Rupee representation (e.g. ₹12,99.00)
 * @param {number} amount - Raw price count
 * @returns {string} Formatted price string
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}
