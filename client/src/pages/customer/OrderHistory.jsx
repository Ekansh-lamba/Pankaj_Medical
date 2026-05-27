import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import OrderCard from '../../components/shared/OrderCard';
import { ShoppingBag, Loader2, Star, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderHistory() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  // Cancel order modal state
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null, orderNumber: '', reason: '' });
  
  // Rate order modal state
  const [rateModal, setRateModal] = useState({ open: false, orderId: null, orderNumber: '', score: 5, comment: '' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/orders/my-orders?page=${page}&limit=10`);
      if (res.data && res.data.success) {
        setOrders(res.data.data.orders);
        setPages(res.data.data.pages);
      }
    } catch (err) {
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleOpenCancel = (orderId, orderNumber) => {
    setCancelModal({ open: true, orderId, orderNumber, reason: '' });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.reason.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }

    try {
      const res = await api.post(`/api/orders/my-orders/${cancelModal.orderId}/cancel`, {
        reason: cancelModal.reason
      });
      if (res.data && res.data.success) {
        toast.success(`Order ${cancelModal.orderNumber} cancelled successfully`);
        setCancelModal({ open: false, orderId: null, orderNumber: '', reason: '' });
        fetchOrders(); // Reload history
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleOpenRate = (orderId, orderNumber) => {
    setRateModal({ open: true, orderId, orderNumber, score: 5, comment: '' });
  };

  const handleConfirmRate = async () => {
    try {
      const res = await api.post(`/api/orders/my-orders/${rateModal.orderId}/rate`, {
        score: rateModal.score,
        comment: rateModal.comment
      });
      if (res.data && res.data.success) {
        toast.success('Thank you for rating!');
        setRateModal({ open: false, orderId: null, orderNumber: '', score: 5, comment: '' });
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    }
  };

  // Filter orders client-side for dynamic tabs
  const getFilteredOrders = () => {
    if (statusFilter === 'all') return orders;
    if (statusFilter === 'pending') {
      return orders.filter(o => ['pending_payment', 'pending_approval'].includes(o.status));
    }
    if (statusFilter === 'active') {
      return orders.filter(o => ['confirmed', 'processing', 'packed', 'shipped'].includes(o.status));
    }
    if (statusFilter === 'delivered') {
      return orders.filter(o => o.status === 'delivered');
    }
    if (statusFilter === 'cancelled') {
      return orders.filter(o => o.status === 'cancelled');
    }
    return orders;
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 bg-gray-50 font-sans">
      <h1 className="text-xl md:text-2xl font-black text-primary-900 mb-8 flex items-center gap-2">
        <ShoppingBag className="w-6 h-6 text-primary-800" /> Order History
      </h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1.5 overflow-x-auto text-xs font-bold text-gray-500 uppercase tracking-wider mb-6 pb-px select-none shrink-0">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'pending', label: 'Pending' },
          { id: 'active', label: 'In Progress' },
          { id: 'delivered', label: 'Delivered' },
          { id: 'cancelled', label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
              statusFilter === tab.id
                ? 'border-primary-600 text-teal-750 font-black'
                : 'border-transparent hover:text-primary-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2" />
          Loading your order history...
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <OrderCard
              key={order._id}
              order={order}
              onCancel={handleOpenCancel}
              onRate={handleOpenRate}
            />
          ))}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6 text-xs font-bold text-gray-500">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => prev - 1)}
                className="btn-white py-1.5 px-3.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="font-extrabold text-primary-900">Page {page} of {pages}</span>
              <button
                disabled={page === pages}
                onClick={() => setPage(prev => prev + 1)}
                className="btn-white py-1.5 px-3.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card-base p-16 text-center max-w-lg mx-auto shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-base font-bold text-primary-900 mb-1">No Orders Found</h2>
          <p className="text-xs text-gray-500 font-semibold max-w-xs mb-6 leading-relaxed">
            You don't have any placed orders matching this filter classification yet.
          </p>
        </div>
      )}

      {/* CANCELLATION DIALOG MODAL */}
      {cancelModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card-base p-5 w-full max-w-md animate-fadeIn space-y-4">
            <h3 className="text-sm font-extrabold text-primary-900 uppercase tracking-widest border-b border-gray-150 pb-2 flex items-center gap-1.5">
              <Ban className="w-4.5 h-4.5 text-red-500" /> Cancel Order {cancelModal.orderNumber}
            </h3>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                Reason for cancellation *
              </label>
              <textarea
                rows={3}
                placeholder="Please tell us why you want to cancel this order..."
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-primary-500 focus:border-primary-500 focus:outline-none resize-none font-semibold text-gray-700"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setCancelModal({ open: false, orderId: null, orderNumber: '', reason: '' })}
                className="btn-white text-xs py-2 px-4 font-bold"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex items-center gap-1.5 text-xs text-white bg-red-600 hover:bg-red-700 font-bold py-2 px-5 rounded-lg transition-colors shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATING DIALOG MODAL */}
      {rateModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card-base p-5 w-full max-w-md animate-fadeIn space-y-5">
            <h3 className="text-sm font-extrabold text-primary-900 uppercase tracking-widest border-b border-gray-150 pb-2 flex items-center gap-1.5">
              <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500" /> Rate Order {rateModal.orderNumber}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Select rating score *
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRateModal({ ...rateModal, score: star })}
                      className="p-1 focus:outline-none transition-transform active:scale-95"
                    >
                      <Star className={`w-7 h-7 ${
                        star <= rateModal.score
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Share your experience with our packaging, speed of service, or medicine quality..."
                  value={rateModal.comment}
                  onChange={(e) => setRateModal({ ...rateModal, comment: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-primary-500 focus:border-primary-500 focus:outline-none resize-none font-semibold text-gray-700"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRateModal({ open: false, orderId: null, orderNumber: '', score: 5, comment: '' })}
                className="btn-white text-xs py-2 px-4 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRate}
                className="btn-primary text-xs py-2 px-5 font-bold shadow-xs"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
