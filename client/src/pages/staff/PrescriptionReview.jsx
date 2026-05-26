import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ZoomIn,
  Clock,
  User,
  Phone,
  ShoppingCart,
  X
} from 'lucide-react';

const PrescriptionReview = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRx, setActiveRx] = useState(null);
  
  // Modals / Action states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReuploadModal, setShowReuploadModal] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Image zoom modal
  const [zoomImage, setZoomImage] = useState(null);

  const fetchPendingPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/prescriptions/pending');
      if (res.data && res.data.success) {
        setPrescriptions(res.data.data);
        if (res.data.data.length > 0) {
          setActiveRx(res.data.data[0]); // default to first item
        } else {
          setActiveRx(null);
        }
      }
    } catch (err) {
      console.error('Fetch pending Rx error:', err);
      toast.error('Failed to load pending prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPrescriptions();
  }, []);

  // Fix 3 — Log prescription imageUrl to console
  useEffect(() => {
    if (prescriptions?.length > 0) {
      console.log('Prescription image URL:', prescriptions[0].imageUrl);
    }
  }, [prescriptions]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to APPROVE this prescription? The order will be confirmed.')) return;
    
    setActionLoading(true);
    try {
      const res = await api.put(`/api/prescriptions/${id}/approve`);
      if (res.data && res.data.success) {
        toast.success('Prescription approved. Order confirmed!');
        fetchPendingPrescriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve prescription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!reasonText.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.put(`/api/prescriptions/${activeRx._id}/reject`, { reason: reasonText });
      if (res.data && res.data.success) {
        toast.success('Prescription rejected. Linked order is cancelled.');
        setShowRejectModal(false);
        setReasonText('');
        fetchPendingPrescriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject prescription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReupload = async (e) => {
    e.preventDefault();
    if (!reasonText.trim()) {
      toast.error('Please enter clarification feedback for re-upload');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.put(`/api/prescriptions/${activeRx._id}/request-reupload`, { reason: reasonText });
      if (res.data && res.data.success) {
        toast.success('Re-upload request sent to customer.');
        setShowReuploadModal(false);
        setReasonText('');
        fetchPendingPrescriptions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit re-upload request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-teal-600" /> Prescription Review Desk
        </h1>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">
          Verify uploaded customer Rx files for Schedule H and NRx medications before dispensing.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
          Loading prescription logs...
        </div>
      ) : prescriptions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* List panel (col index 1-4) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col max-h-[600px]">
            <div className="bg-slate-50 border-b border-slate-200 p-4 font-black text-slate-700 text-xs uppercase tracking-wider">
              Pending Queue ({prescriptions.length})
            </div>
            
            <div className="flex-grow overflow-y-auto divide-y divide-slate-150">
              {prescriptions.map((rx) => (
                <div
                  key={rx._id}
                  onClick={() => setActiveRx(rx)}
                  className={`p-4 cursor-pointer transition-colors ${
                    activeRx?._id === rx._id
                      ? 'bg-teal-50/40 border-l-4 border-teal-600'
                      : 'hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2 mb-1.5">
                    <span className="text-xs font-black text-slate-800 uppercase">
                      Order: {rx.order?.orderNumber || 'N/A'}
                    </span>
                    <span className="text-[9px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> Pending
                    </span>
                  </div>
                  
                  <div className="text-[11px] font-semibold text-slate-500 space-y-0.5">
                    <p className="font-extrabold text-slate-700 uppercase">{rx.customer?.name}</p>
                    <p>Uploaded: {new Date(rx.createdAt).toLocaleDateString()}</p>
                    <p className="text-teal-800 font-bold">Value: {formatCurrency(rx.order?.grandTotal || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active details viewport (col index 5-12) */}
          <div className="lg:col-span-8 space-y-6">
            {activeRx && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                
                {/* Image panel */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 flex justify-between items-center">
                    <span>Uploaded Rx Image</span>
                    <button
                      onClick={() => setZoomImage(activeRx.imageUrl)}
                      className="text-teal-700 hover:text-teal-800 text-[10px] font-bold flex items-center gap-0.5 bg-teal-50 px-2 py-0.5 rounded"
                    >
                      <ZoomIn className="w-3.5 h-3.5" /> Fullscreen Zoom
                    </button>
                  </h3>
                  <div className="prescription-image-container">
                    <button
                      onClick={() => window.open(activeRx.imageUrl, '_blank')}
                      className="w-full py-3 border-2 border-dashed border-teal-400 rounded-lg text-teal-600 font-bold hover:bg-teal-50 transition-colors text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      🔍 Click to View Prescription Image
                    </button>
                    <img
                      src={activeRx.imageUrl}
                      alt="Prescription Scan"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      className="w-full mt-2 rounded-lg max-h-[300px] object-contain border border-slate-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Details & Actions Panel */}
                <div className="flex flex-col justify-between space-y-6">
                  
                  {/* Info Metadata */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> Customer Details
                      </h4>
                      <div className="text-xs font-semibold text-slate-700 leading-normal">
                        <p className="font-extrabold uppercase text-slate-800">{activeRx.customer?.name}</p>
                        <p className="text-[11px] text-slate-500">{activeRx.customer?.email}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {activeRx.customer?.phone || 'Not configured'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b border-slate-100 flex items-center gap-1">
                        <ShoppingCart className="w-3.5 h-3.5" /> Linked Order Details
                      </h4>
                      <div className="text-xs font-semibold text-slate-700 leading-normal">
                        <p className="font-extrabold text-slate-800">ID: {activeRx.order?.orderNumber}</p>
                        <p className="text-teal-800 font-bold">Total: {formatCurrency(activeRx.order?.grandTotal || 0)}</p>
                        <a
                          href={activeRx.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download="prescription"
                          className="text-xs font-bold text-teal-600 hover:text-teal-700 underline mt-2 block"
                        >
                          Download Prescription
                        </a>
                        
                        <div className="mt-2.5 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {activeRx.order?.items?.map((item) => (
                            <div key={item.product} className="flex justify-between items-center text-[11px] bg-slate-50 p-2 border border-slate-150 rounded-lg">
                              <span className="font-extrabold uppercase text-slate-700 truncate max-w-[130px]">{item.name}</span>
                              <span className="font-black text-teal-800 shrink-0">Qty: {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleApprove(activeRx._id)}
                      disabled={actionLoading}
                      className="w-full btn-teal py-2.5 font-bold text-xs rounded-lg flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve Prescription
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowReuploadModal(true)}
                        disabled={actionLoading}
                        className="btn-teal-outline py-2 font-bold text-[10px] rounded-lg uppercase flex items-center justify-center gap-1 bg-white"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Request Re-upload
                      </button>

                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 py-2 font-bold text-[10px] rounded-lg uppercase flex items-center justify-center gap-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-600" /> Reject & Cancel
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-20 text-center max-w-lg mx-auto shadow-xs flex flex-col items-center justify-center">
          <CheckCircle className="w-10 h-10 text-teal-600 mb-3" />
          <h2 className="text-base font-bold text-slate-900 mb-1">Desk is clear!</h2>
          <p className="text-xs text-slate-500 font-semibold max-w-xs leading-relaxed">
            No customers have pending prescriptions requiring verification at this time.
          </p>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleReject} className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1">
              <XCircle className="w-5 h-5 text-red-500" /> Reject Prescription
            </h3>
            
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Rejecting this prescription will permanently cancel the customer's linked order and restore all reserved medicines to stock. Provide a clear reason:
            </p>

            <textarea
              required
              rows={3}
              placeholder="e.g. Prescription has expired or contains a different patient name."
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 border border-slate-250 p-2.5 rounded-lg focus:outline-none focus:border-teal-500"
            />

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowRejectModal(false); setReasonText(''); }}
                className="btn-white text-[11px] py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn-teal bg-red-600 hover:bg-red-700 text-[11px] py-2 px-4 text-white"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Prescription'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Request Reupload Modal */}
      {showReuploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleRequestReupload} className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-1">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Request Prescription Re-upload
            </h3>
            
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Ask the customer to upload a clearer, valid prescription image. The order will remain in pending approval state. Provide feedback:
            </p>

            <textarea
              required
              rows={3}
              placeholder="e.g. The uploaded scan is blurry. Please upload a high-resolution, clear prescription image showing doctor name."
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full text-xs font-semibold text-slate-800 border border-slate-250 p-2.5 rounded-lg focus:outline-none focus:border-teal-500"
            />

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowReuploadModal(false); setReasonText(''); }}
                className="btn-white text-[11px] py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn-teal bg-amber-600 hover:bg-amber-700 text-[11px] py-2 px-4 text-white"
              >
                {actionLoading ? 'Submitting...' : 'Request Clarification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Zoom lightbox */}
      {zoomImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/35 text-white p-2 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center">
            <img
              src={zoomImage}
              alt="Zoomed Prescription Scan"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] object-contain rounded-lg border border-white/10"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default PrescriptionReview;
