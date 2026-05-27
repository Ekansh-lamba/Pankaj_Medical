import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  Search,
  Filter,
  CheckCircle,
  Truck,
  PackageCheck,
  AlertCircle,
  Clock,
  Check,
  XCircle,
  Undo2,
  DollarSign,
  User,
  Phone,
  FileText
} from 'lucide-react';

const OrderQueue = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rxFilter, setRxFilter] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Status labels for select dropdowns
  const ALL_STATUSES = [
    { value: 'pending_payment', label: 'Pending Payment' },
    { value: 'pending_approval', label: 'Pending Store Approval' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'packed', label: 'Packed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'return_requested', label: 'Return Requested' },
    { value: 'return_approved', label: 'Return Approved' },
    { value: 'return_rejected', label: 'Return Rejected' }
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (rxFilter) params.hasRx = 'true';
      if (searchTerm) params.q = searchTerm;

      const res = await api.get('/api/orders', { params });
      if (res.data && res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, rxFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusTransition = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      if (res.data && res.data.success) {
        toast.success(`Order status updated to ${newStatus.toUpperCase().replace('_', ' ')}`);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Illegal transition or server error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCodCollected = async (orderId) => {
    setUpdatingId(orderId);
    try {
      const res = await api.put(`/api/orders/${orderId}/cod-collected`);
      if (res.data && res.data.success) {
        toast.success('COD fee marked as COLLECTED');
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReturnAction = async (orderId, action, notes) => {
    if (!isAdmin) {
      toast.error('Only administrators can approve or reject return requests');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to ${action} this return?`)) return;

    setUpdatingId(orderId);
    try {
      const res = await api.put(`/api/orders/${orderId}/return-action`, { action, staffNotes: notes || 'Processed by admin' });
      if (res.data && res.data.success) {
        toast.success(`Return request ${action} successfully`);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process return');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending_payment': return 'bg-amber-100 text-amber-800 border-amber-250';
      case 'pending_approval': return 'bg-purple-100 text-purple-800 border-purple-250';
      case 'confirmed': return 'bg-teal-100 text-teal-800 border-teal-250';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-250';
      case 'packed': return 'bg-sky-100 text-sky-800 border-sky-250';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 border-indigo-250';
      case 'delivered': return 'bg-green-150 text-green-800 border-green-250';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-250';
      case 'return_requested': return 'bg-pink-100 text-pink-800 border-pink-250 animate-pulse';
      case 'return_approved': return 'bg-rose-100 text-rose-800 border-rose-250';
      case 'return_rejected': return 'bg-stone-100 text-stone-800 border-stone-250';
      default: return 'bg-gray-100 text-gray-800 border-gray-250';
    }
  };

  const getLegalNextStatuses = (currentStatus) => {
    // Matches server-side LEGAL_TRANSITIONS rules
    const transitions = {
      pending_payment: ['payment_failed', 'pending_approval', 'confirmed', 'cancelled'],
      payment_failed: [],
      pending_approval: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['packed', 'cancelled'],
      packed: ['shipped'],
      shipped: ['delivered'],
      delivered: ['return_requested'],
      cancelled: [],
      return_requested: ['return_approved', 'return_rejected'],
      return_approved: [],
      return_rejected: []
    };
    return transitions[currentStatus] || [];
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900">Order Sweep Queue</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Monitor, pack, and transition retail drug deliveries inside Kanpur.
          </p>
        </div>
        
        {/* Quick status counters */}
        <div className="flex gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase border border-purple-200 bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
            Awaiting Approval: {orders.filter(o => o.status === 'pending_approval').length}
          </span>
          <span className="text-[10px] font-black uppercase border border-pink-250 bg-pink-50 text-pink-700 px-3 py-1 rounded-full">
            Returns: {orders.filter(o => o.status === 'return_requested').length}
          </span>
          <span className="text-[10px] font-black uppercase border border-teal-200 bg-teal-50 text-teal-700 px-3 py-1 rounded-full">
            Active Confirmed: {orders.filter(o => ['confirmed', 'processing', 'packed', 'shipped'].includes(o.status)).length}
          </span>
        </div>
      </div>

      {/* Filters board */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, customer, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 border border-slate-250 pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-teal-500"
            />
          </div>
          <button type="submit" className="btn-teal py-2.5 px-4 text-xs font-bold shrink-0">
            Search
          </button>
        </form>

        {/* Action Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-250 p-2 rounded-lg bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* H/NRx filter checkbox */}
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rxFilter}
              onChange={(e) => setRxFilter(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 border-slate-300"
            />
            <span>Requires Prescription</span>
          </label>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
          Sweeping the order logs...
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const nextStatuses = getLegalNextStatuses(order.status);
            const hasRxItems = order.items.some(i => i.rxType === 'H' || i.rxType === 'NRX');

            return (
              <div key={order._id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-colors">
                
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-900 uppercase">
                      Order: {order.orderNumber}
                    </span>
                    <div className="text-[10px] font-bold text-slate-400">
                      Placed: {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {hasRxItems && (
                      <span className="text-[9px] font-black uppercase border border-purple-200 bg-purple-100/50 text-purple-700 px-2.5 py-0.5 rounded flex items-center gap-1">
                        <FileText className="w-3 h-3" /> H/NRx
                      </span>
                    )}
                    <span className={`text-[10px] font-black uppercase border px-2.5 py-0.5 rounded-full ${getStatusBadgeClass(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Col 1: Customer & Address */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Customer Info
                    </h4>
                    <div className="text-xs font-semibold text-slate-800">
                      <p className="font-extrabold uppercase text-teal-800">{order.customer?.name || 'Anonymized User'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{order.customer?.email}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {order.customer?.phone || 'No phone'}
                      </p>
                    </div>

                    {order.deliveryType === 'delivery' ? (
                      <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-150 p-2.5 rounded-lg leading-normal">
                        <span className="font-black text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">
                          Delivery Address
                        </span>
                        {order.deliveryAddress?.line1}, {order.deliveryAddress?.line2 && `${order.deliveryAddress.line2}, `}
                        {order.deliveryAddress?.city} - {order.deliveryAddress?.pinCode}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-teal-800 bg-teal-50/50 border border-teal-150 p-2.5 rounded-lg font-bold">
                        Store Pickup Selected
                      </div>
                    )}
                  </div>

                  {/* Col 2: Medicines List */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">
                      Prescribed Medicines ({order.items.length})
                    </h4>
                    
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {order.items.map((item) => (
                        <div key={item.product} className="flex justify-between items-center gap-3 text-xs bg-slate-50/50 p-2 border border-slate-150 rounded-lg">
                          <div className="min-w-0">
                            <p className="font-black uppercase text-slate-700 truncate">{item.name}</p>
                            {item.rxType && item.rxType !== 'NONE' && (
                              <span className="text-[8px] font-bold text-red-600 uppercase mt-0.5 block">
                                Schedule {item.rxType}
                              </span>
                            )}
                          </div>
                          <span className="font-extrabold text-teal-800 shrink-0 text-[11px]">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Col 3: Checkout Pricing & COD details */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100">
                      Payment & Finance
                    </h4>
                    <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="font-extrabold uppercase text-slate-800">{order.payment?.method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Status:</span>
                        <span className={`font-black uppercase ${order.payment?.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                          {order.payment?.status}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-1.5 text-sm font-black text-slate-800">
                        <span>Grand Total:</span>
                        <span className="text-teal-800">{formatCurrency(order.grandTotal)}</span>
                      </div>
                    </div>

                    {/* Return request reason */}
                    {order.status === 'return_requested' && (
                      <div className="bg-pink-50 border border-pink-100 p-2.5 rounded-lg text-xs leading-normal">
                        <span className="font-black text-[9px] uppercase tracking-wider text-pink-700 block mb-0.5">
                          Return Reason
                        </span>
                        <p className="text-pink-800 font-bold italic">"{order.returnReason}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* COD Cash collector button */}
                  <div>
                    {order.payment?.method === 'cod' && order.payment?.status !== 'paid' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCodCollected(order._id)}
                        disabled={updatingId === order._id}
                        className="btn-teal-outline text-[11px] py-1.5 px-3 flex items-center gap-1 font-bold border-teal-500 bg-white"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-teal-600" /> Collect COD cash
                      </button>
                    )}
                  </div>

                  {/* Transition actions */}
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    
                    {/* Legal Status Steppers */}
                    {nextStatuses.map((nextStatus) => {
                      // Handled by return actions separately for Admin
                      if (['return_approved', 'return_rejected'].includes(nextStatus)) return null;

                      return (
                        <button
                          key={nextStatus}
                          onClick={() => handleStatusTransition(order._id, nextStatus)}
                          disabled={updatingId === order._id}
                          className="bg-white border border-slate-250 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-[10px] font-black uppercase py-1.5 px-3 rounded transition-all"
                        >
                          Mark {nextStatus.replace('_', ' ')}
                        </button>
                      );
                    })}

                    {/* Admin-only Return approval controls */}
                    {order.status === 'return_requested' && (
                      <div className="flex gap-2">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => handleReturnAction(order._id, 'approved')}
                              disabled={updatingId === order._id}
                              className="btn-teal bg-green-600 hover:bg-green-700 border-none text-[10px] font-black uppercase py-1.5 px-3 rounded flex items-center gap-1 text-white"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Return
                            </button>
                            <button
                              onClick={() => handleReturnAction(order._id, 'rejected')}
                              disabled={updatingId === order._id}
                              className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase py-1.5 px-3 rounded flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject Return
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded uppercase leading-normal">
                            Return review pending admin action
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center max-w-lg mx-auto shadow-xs flex flex-col items-center justify-center">
          <Clock className="w-8 h-8 text-slate-300 mb-2" />
          <h2 className="text-base font-bold text-slate-900 mb-1">Queue is clear!</h2>
          <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed">
            No matching orders have been placed in this status index yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default OrderQueue;
