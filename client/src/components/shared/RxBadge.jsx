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
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300 ${className}`}>
          Schedule H1
        </span>
      );
    case 'H':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300 ${className}`}>
          ⚕ Prescription Required
        </span>
      );
    case 'NRX':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-300 ${className}`}>
          🏪 Store Approval Required
        </span>
      );
    case 'OTC':
    default:
      // OTC renders nothing
      return null;
  }
}
