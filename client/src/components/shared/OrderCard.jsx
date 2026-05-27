import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { Eye, Ban, Star } from 'lucide-react';

const STATUS_BADGES = {
  pending_payment: 'bg-amber-50 text-amber-600 border-amber-150',
  payment_failed: 'bg-red-50 text-red-600 border-red-150',
  pending_approval: 'bg-amber-50 text-amber-600 border-amber-150 animate-pulse',
  confirmed: 'bg-blue-50 text-blue-600 border-blue-150',
  processing: 'bg-blue-50 text-blue-600 border-blue-150',
  packed: 'bg-indigo-50 text-indigo-600 border-indigo-150',
  shipped: 'bg-purple-50 text-purple-600 border-purple-150',
  delivered: 'bg-green-50 text-green-600 border-green-150',
  cancelled: 'bg-red-50 text-red-650 border-red-150',
  return_requested: 'bg-amber-50 text-amber-600 border-amber-150',
  return_approved: 'bg-green-50 text-green-600 border-green-150',
  return_rejected: 'bg-red-50 text-red-600 border-red-150'
};

const STATUS_LABELS = {
  pending_payment: '⏳ Pending Payment',
  payment_failed: '✗ Payment Failed',
  pending_approval: '⏳ Awaiting Approval',
  confirmed: '✓ Confirmed',
  processing: '⚙ Processing',
  packed: '📦 Packed & Ready',
  shipped: '🚚 Shipped',
  delivered: '✓ Delivered',
  cancelled: '✗ Cancelled',
  return_requested: '⏳ Return Requested',
  return_approved: '✓ Return Approved',
  return_rejected: '✗ Return Rejected'
};

export default function OrderCard({ order, onCancel, onRate }) {
  const isCancellable = ['pending_payment', 'pending_approval', 'confirmed', 'processing'].includes(order.status);
  const isDelivered = order.status === 'delivered';
  const isRated = !!order.rating?.score;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="space-y-2">
        {/* Top Info */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-black text-primary-900 tracking-wider">
            {order.orderNumber}
          </span>
          <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${
            STATUS_BADGES[order.status] || 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>

        {/* Mid Info */}
        <div className="text-xs text-slate-500 font-semibold flex items-center gap-4 flex-wrap">
          <span>Items Count: <span className="text-slate-700 font-extrabold">{order.items.reduce((acc, i) => acc + i.quantity, 0)}</span></span>
          <span>Delivery Type: <span className="text-slate-700 font-extrabold uppercase">{order.deliveryType}</span></span>
          {order.payment?.method && (
            <span>Payment: <span className="text-slate-700 font-extrabold uppercase">{order.payment.method}</span></span>
          )}
        </div>

        {/* Grand Total */}
        <div className="text-sm text-slate-500 font-bold">
          Total Amount: <span className="text-primary-600 text-base font-black">{formatCurrency(order.grandTotal)}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2 md:self-center shrink-0">
        <Link
          to={`/my-orders/${order._id}`}
          className="btn-secondary text-xs py-2.5 px-4 font-bold flex items-center gap-1.5 shadow-sm"
        >
          <Eye className="w-3.5 h-3.5" /> View Details
        </Link>

        {isCancellable && (
          <button
            onClick={() => onCancel(order._id, order.orderNumber)}
            className="flex items-center gap-1.5 text-xs text-red-650 bg-red-50 hover:bg-red-100 hover:text-red-750 font-bold py-2.5 px-4 rounded-lg transition-colors border border-red-150"
          >
            <Ban className="w-3.5 h-3.5" /> Cancel
          </button>
        )}

        {isDelivered && !isRated && (
          <button
            onClick={() => onRate(order._id, order.orderNumber)}
            className="flex items-center gap-1.5 text-xs text-primary-600 bg-primary-50 hover:bg-primary-100 hover:text-primary-700 font-bold py-2.5 px-4 rounded-lg transition-colors border border-primary-100 shadow-sm"
          >
            <Star className="w-3.5 h-3.5" /> Rate Order
          </button>
        )}

        {isRated && (
          <div className="flex items-center gap-1 text-xs text-amber-500 bg-amber-50/50 border border-amber-100/50 px-3 py-2.5 rounded-lg font-bold">
            <Star className="w-3.5 h-3.5 fill-current" /> Rated {order.rating.score}/5
          </div>
        )}
      </div>
    </div>
  );
}
