import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { Eye, Ban, Star } from 'lucide-react';

const STATUS_BADGES = {
  pending_payment: 'bg-amber-50 text-amber-600 border-amber-100',
  payment_failed: 'bg-red-50 text-red-600 border-red-100',
  pending_approval: 'bg-red-50 text-red-600 border-red-100 animate-pulse',
  confirmed: 'bg-blue-50 text-blue-600 border-blue-100',
  processing: 'bg-blue-50 text-blue-600 border-blue-100',
  packed: 'bg-teal-50 text-teal-600 border-teal-100',
  shipped: 'bg-teal-50 text-teal-600 border-teal-100',
  delivered: 'bg-green-50 text-green-600 border-green-100',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  return_requested: 'bg-amber-50 text-amber-600 border-amber-100',
  return_approved: 'bg-green-50 text-green-600 border-green-100',
  return_rejected: 'bg-red-50 text-red-600 border-red-100'
};

const STATUS_LABELS = {
  pending_payment: 'Pending Payment',
  payment_failed: 'Payment Failed',
  pending_approval: 'Pending Prescription Approval',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed & Ready',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  return_approved: 'Return Approved',
  return_rejected: 'Return Rejected'
};

export default function OrderCard({ order, onCancel, onRate }) {
  const isCancellable = ['pending_payment', 'pending_approval', 'confirmed', 'processing'].includes(order.status);
  const isDelivered = order.status === 'delivered';
  const isRated = !!order.rating?.score;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xs transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="space-y-2">
        {/* Top Info */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-black text-gray-800 tracking-wider">
            {order.orderNumber}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
            STATUS_BADGES[order.status] || 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>

        {/* Mid Info */}
        <div className="text-xs text-gray-500 font-semibold flex items-center gap-4 flex-wrap">
          <span>Items Count: <span className="text-gray-700 font-extrabold">{order.items.reduce((acc, i) => acc + i.quantity, 0)}</span></span>
          <span>Delivery Type: <span className="text-gray-700 font-extrabold uppercase">{order.deliveryType}</span></span>
          {order.payment?.method && (
            <span>Payment: <span className="text-gray-700 font-extrabold uppercase">{order.payment.method}</span></span>
          )}
        </div>

        {/* Grand Total */}
        <div className="text-sm text-gray-500 font-bold">
          Total Amount: <span className="text-teal-800 text-base font-black">{formatCurrency(order.grandTotal)}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2 md:self-center shrink-0">
        <Link
          to={`/my-orders/${order._id}`}
          className="btn-white text-xs py-2 px-4 font-bold flex items-center gap-1.5 shadow-xs"
        >
          <Eye className="w-3.5 h-3.5" /> View Details
        </Link>

        {isCancellable && (
          <button
            onClick={() => onCancel(order._id, order.orderNumber)}
            className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 font-bold py-2 px-4 rounded-lg transition-colors border border-red-100"
          >
            <Ban className="w-3.5 h-3.5" /> Cancel
          </button>
        )}

        {isDelivered && !isRated && (
          <button
            onClick={() => onRate(order._id, order.orderNumber)}
            className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 hover:text-teal-800 font-bold py-2 px-4 rounded-lg transition-colors border border-teal-100 shadow-xs"
          >
            <Star className="w-3.5 h-3.5" /> Rate Order
          </button>
        )}

        {isRated && (
          <div className="flex items-center gap-1 text-xs text-amber-500 bg-amber-50/50 border border-amber-100/50 px-3 py-2 rounded-lg font-bold">
            <Star className="w-3.5 h-3.5 fill-current" /> Rated {order.rating.score}/5
          </div>
        )}
      </div>
    </div>
  );
}
