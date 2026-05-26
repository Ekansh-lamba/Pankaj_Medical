import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import OrderTimeline from '../../components/shared/OrderTimeline';
import RxBadge from '../../components/shared/RxBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  ArrowLeft,
  Loader2,
  FileText,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Ban,
  ArrowRight,
  ShieldAlert,
  Upload,
  Undo2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);

  // Return request modal state
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  // Re-upload prescription state
  const [reuploadFile, setReuploadFile] = useState(null);
  const [reuploadPreview, setReuploadPreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/orders/my-orders/${id}`);
      if (res.data && res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleCancelOrder = async () => {
    const reason = window.prompt('Enter cancellation reason:');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Cancellation reason is required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/api/orders/my-orders/${order._id}/cancel`, { reason });
      if (res.data && res.data.success) {
        toast.success('Order cancelled successfully');
        fetchOrderDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
      setLoading(false);
    }
  };

  const handleRequestReturn = async (e) => {
    e.preventDefault();
    if (!returnReason.trim()) {
      toast.error('Return reason is required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/api/orders/my-orders/${order._id}/return`, { reason: returnReason });
      if (res.data && res.data.success) {
        toast.success('Return request raised successfully');
        setReturnOpen(false);
        setReturnReason('');
        fetchOrderDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request return');
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB maximum limit.');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG, or PDF files are accepted.');
      return;
    }

    setReuploadFile(file);
    if (file.type !== 'application/pdf') {
      setReuploadPreview(URL.createObjectURL(file));
    } else {
      setReuploadPreview('pdf');
    }
  };

  const handlePrescriptionReupload = async () => {
    if (!reuploadFile) {
      toast.error('Please select a prescription file first');
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('orderId', order._id);
      formData.append('prescription', reuploadFile);

      const res = await api.post('/api/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        toast.success('Clarification prescription uploaded successfully');
        setReuploadFile(null);
        setReuploadPreview(null);
        fetchOrderDetail();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="py-20 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
        Fetching order logs...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center text-xs text-gray-400 font-semibold">
        Order not found. <Link to="/my-orders" className="text-teal-700">Return to History</Link>
      </div>
    );
  }

  const isCancellable = ['pending_payment', 'pending_approval', 'confirmed', 'processing'].includes(order.status);
  const isReturnable = order.status === 'delivered';

  // Find prescription details if any
  const rxDoc = order.prescriptions?.[order.prescriptions.length - 1];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 bg-gray-50 font-sans space-y-6">
      {/* Header and Back */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-250 pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/my-orders"
            className="p-1.5 border border-gray-250 rounded-lg text-gray-500 hover:text-teal-700 hover:border-teal-100 transition-colors bg-white shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-teal-900 leading-tight">Order Details</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              Ref: <span className="text-gray-800 tracking-normal font-black">{order.orderNumber}</span>
            </p>
          </div>
        </div>

        {/* Action Header bar */}
        <div className="flex items-center gap-2">
          {isCancellable && (
            <button
              onClick={handleCancelOrder}
              className="flex items-center gap-1 text-xs text-red-650 bg-red-50 hover:bg-red-100 font-bold py-2 px-4 rounded-lg border border-red-100 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" /> Cancel Order
            </button>
          )}

          {isReturnable && (
            <button
              onClick={() => setReturnOpen(true)}
              className="flex items-center gap-1 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 font-bold py-2 px-4 rounded-lg border border-teal-100 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" /> Return Items
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Split timeline and items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline (Left 1col on desktop) */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5 shadow-xs h-fit space-y-5">
          <OrderTimeline timeline={order.timeline} currentStatus={order.status} />

          {/* Payment metadata */}
          <div className="border-t border-gray-150 pt-4 text-xs font-semibold text-gray-500 leading-normal space-y-1.5">
            <div>
              Payment Method: <span className="text-gray-800 font-extrabold uppercase">{order.payment.method}</span>
            </div>
            <div>
              Payment Status:{' '}
              <span className={`font-extrabold uppercase tracking-wider ${
                order.payment.status === 'paid' ? 'text-green-600' : 'text-gray-400'
              }`}>{order.payment.status}</span>
            </div>
            {order.payment.paidAt && (
              <div className="text-[10px] text-gray-400 font-bold">
                Paid At: {new Date(order.payment.paidAt).toLocaleTimeString('en-IN')}
              </div>
            )}
          </div>
        </div>

        {/* Invoice breakdown items + address (Right 2col) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prescription Re-upload Alerts and boxes */}
          {order.status === 'pending_approval' && rxDoc && rxDoc.status === 'reupload_requested' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-start gap-3 text-xs text-amber-800 font-bold leading-normal">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
                <div>
                  <h4 className="font-black text-amber-900">Action Required: Prescription Re-upload Requested</h4>
                  <p className="mt-0.5 text-[11px] text-amber-700 font-medium">
                    Our pharmacy staff requested clarification. Reason: <span className="italic font-bold">"{rxDoc.reuploadReason}"</span>. Please upload a clearer copy to proceed.
                  </p>
                </div>
              </div>

              {/* Upload field */}
              <div className="bg-white border border-amber-100/50 rounded-xl p-4 flex flex-col items-center gap-3">
                {reuploadPreview ? (
                  <div className="w-full max-w-xs space-y-3">
                    <div className="border border-gray-150 rounded-lg p-2 bg-gray-50 flex items-center justify-center max-h-36 overflow-hidden">
                      {reuploadPreview === 'pdf' ? (
                        <div className="text-xs font-bold text-gray-500 py-4 flex flex-col items-center gap-1">
                          <FileText className="w-8 h-8 text-teal-600" />
                          <span>Clarification.pdf loaded</span>
                        </div>
                      ) : (
                        <img src={reuploadPreview} alt="Preview" className="object-contain max-h-32" />
                      )}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          setReuploadFile(null);
                          setReuploadPreview(null);
                        }}
                        className="btn-white text-[10px] py-1.5 px-3 font-bold"
                      >
                        Change
                      </button>
                      <button
                        onClick={handlePrescriptionReupload}
                        disabled={uploadLoading}
                        className="btn-teal text-[10px] py-1.5 px-4 font-bold flex items-center gap-1 shadow-xs"
                      >
                        {uploadLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Submit Re-upload'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full max-w-sm border border-dashed border-gray-300 hover:border-teal-400 rounded-lg p-6 bg-gray-50 text-center cursor-pointer transition-colors flex flex-col items-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs font-black text-gray-700">Choose clearer prescription copy</span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Delivery Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs text-xs leading-normal flex items-start gap-3">
            <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-extrabold text-teal-900 uppercase tracking-widest border-b border-gray-100 pb-1.5 mb-2.5">
                Delivery Details
              </h3>
              {order.deliveryType === 'delivery' && order.deliveryAddress ? (
                <div>
                  <p className="font-bold text-gray-800 uppercase tracking-wider">{order.deliveryAddress.label}</p>
                  <p className="text-gray-500 font-medium mt-1 leading-normal">
                    {order.deliveryAddress.line1}, {order.deliveryAddress.line2 && `${order.deliveryAddress.line2}, `}
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} - <span className="font-extrabold">{order.deliveryAddress.pinCode}</span>
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-gray-800">In-Store Self-Pickup</p>
                  <p className="text-gray-500 font-medium mt-0.5">Pankaj Medical Stores, Kidwainagar, Kanpur Nagar, UP</p>
                </div>
              )}
            </div>
          </div>

          {/* Prescription Status Details (If Rx order) */}
          {order.prescriptions && order.prescriptions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs text-xs leading-normal">
              <h3 className="font-extrabold text-teal-900 uppercase tracking-widest border-b border-gray-150 pb-2.5 mb-3 flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5" /> Prescription Verification Status
              </h3>
              <div className="space-y-3">
                {order.prescriptions.map((rx, idx) => (
                  <div key={rx._id} className="flex items-center justify-between gap-4 border border-gray-150 rounded-xl p-3.5 bg-gray-50">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        Document #{idx + 1}
                      </span>
                      <p className="font-bold text-gray-700 mt-0.5">
                        Uploaded on {new Date(rx.createdAt).toLocaleDateString('en-IN')}
                      </p>
                      {rx.rejectionReason && (
                        <p className="text-[11px] text-red-500 font-semibold mt-1">
                          Rejection Reason: <span className="italic">"{rx.rejectionReason}"</span>
                        </p>
                      )}
                      {rx.reuploadReason && (
                        <p className="text-[11px] text-amber-600 font-semibold mt-1">
                          Clarification Reason: <span className="italic">"{rx.reuploadReason}"</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <a
                        href={rx.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-teal-700 hover:underline font-extrabold"
                      >
                        View Signed Image
                      </a>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        rx.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                        rx.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                        rx.status === 'reupload_requested' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {rx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoice item lists */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-150 pb-2.5">
              Invoice Items Breakdown
            </h3>
            
            <div className="divide-y divide-gray-150 text-xs">
              {order.items.map((item) => (
                <div key={item._id} className="py-4 flex gap-4 items-center">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-150 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-gray-800 uppercase tracking-wide truncate max-w-xs md:max-w-md">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                          {item.brand} &bull; Qty: <span className="text-gray-700 font-extrabold">{item.quantity}</span>
                        </p>
                      </div>
                      
                      <span className="font-black text-gray-800 shrink-0">
                        {formatCurrency(item.sellingPrice * item.quantity)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <RxBadge rxType={item.rxType} />
                      <span className="text-[9px] text-gray-400 font-bold uppercase">HSN: {item.hsnCode || '3004'}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">GST: {item.gstRate || 12}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price breakdown lists */}
            <div className="border-t border-gray-150 pt-4 flex flex-col items-end text-xs font-semibold text-gray-500 leading-normal space-y-2.5">
              <div className="w-full max-w-xs flex justify-between">
                <span>Subtotal (Inclusive of GST)</span>
                <span className="text-gray-800 font-bold">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="w-full max-w-xs flex justify-between">
                <span>GST Tax Component (Included)</span>
                <span className="text-gray-800 font-bold">{formatCurrency(order.gstTotal)}</span>
              </div>
              <div className="w-full max-w-xs flex justify-between">
                <span>Delivery Charge</span>
                <span className="text-gray-800 font-bold">
                  {order.deliveryCharge === 0 ? 'FREE' : formatCurrency(order.deliveryCharge)}
                </span>
              </div>
              <div className="w-full max-w-xs border-t border-gray-150 pt-2.5 flex justify-between font-black text-sm text-teal-900">
                <span>Grand Total</span>
                <span className="font-black text-base">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RETURN MODAL */}
      {returnOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRequestReturn} className="bg-white border border-gray-200 rounded-xl p-5 w-full max-w-md animate-fadeIn space-y-4">
            <h3 className="text-sm font-extrabold text-teal-900 uppercase tracking-widest border-b border-gray-150 pb-2 flex items-center gap-1.5">
              <Undo2 className="w-4.5 h-4.5 text-teal-600" /> Raise Return Request
            </h3>
            
            <div className="space-y-3 text-xs leading-normal">
              <p className="text-gray-400 font-semibold italic">
                Tip: Returns are inspected by a pharmacy auditor. Medicines must be unopened, in original seals, and returned within standard return windows.
              </p>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Reason for Return *
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us why you are returning these items (e.g. prescribed medicine changed, incorrect batch received)..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-teal-500 focus:border-teal-500 focus:outline-none resize-none font-semibold text-gray-700"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setReturnOpen(false);
                  setReturnReason('');
                }}
                className="btn-white text-xs py-2 px-4 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-teal text-xs py-2 px-5 font-bold shadow-xs"
              >
                Submit Return Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
