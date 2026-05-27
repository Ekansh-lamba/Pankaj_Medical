import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { AlertCircle, AlertTriangle, BadgeAlert, CheckCircle, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ExpiryPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Expiry states
  const [expiredList, setExpiredList] = useState([]);
  const [nearExpiryList, setNearExpiryList] = useState([]);
  const [expiringSoonList, setExpiringSoonList] = useState([]);
  const [valueAtRisk, setValueAtRisk] = useState(0);

  // Active Tab: 'expired' | 'near' | 'soon'
  const [activeTab, setActiveTab] = useState('expired');

  const fetchExpiryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/products/expiry');
      if (response.data && response.data.success) {
        const { expired, nearExpiry, expiringSoon, valueAtRisk } = response.data.data;
        setExpiredList(expired || []);
        setNearExpiryList(nearExpiry || []);
        setExpiringSoonList(expiringSoon || []);
        setValueAtRisk(valueAtRisk || 0);
      }
    } catch (err) {
      console.error('Failed to load expiry records:', err);
      setError('Failed to fetch the stock expiry report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiryData();
  }, []);

  const handleMarkDisposed = async (id, name) => {
    const confirm = window.confirm(`Are you absolutely sure you want to mark "${name}" as DISPOSED? This will soft-delete and deactivate the item.`);
    if (!confirm) return;

    try {
      const response = await api.delete(`/api/products/${id}`);
      if (response.data && response.data.success) {
        alert(`Product "${name}" marked as disposed and deactivated.`);
        fetchExpiryData(); // Refresh lists
      }
    } catch (err) {
      console.error('Failed to dispose product:', err);
      alert(err.response?.data?.message || 'Failed to dispose product.');
    }
  };

  const handleToggleVisibility = async (id, currentHidden, name) => {
    const actionText = currentHidden ? 'show' : 'hide';
    const reason = window.prompt(`Enter a reason to ${actionText} "${name}" in client portal:`, 'Expiry audit override');
    if (reason === null) return; // cancelled

    try {
      const response = await api.put(`/api/products/${id}/toggle-visibility`, {
        isHidden: !currentHidden,
        reason
      });
      if (response.data && response.data.success) {
        alert(`Visibility updated successfully.`);
        fetchExpiryData();
      }
    } catch (err) {
      console.error('Error overriding visibility:', err);
      alert(err.response?.data?.message || 'Failed to override visibility.');
    }
  };

  const getActiveList = () => {
    if (activeTab === 'near') return nearExpiryList;
    if (activeTab === 'soon') return expiringSoonList;
    return expiredList;
  };

  const getRowClass = () => {
    if (activeTab === 'near') return 'bg-amber-50/10 hover:bg-amber-50/30';
    if (activeTab === 'soon') return 'bg-yellow-50/10 hover:bg-yellow-50/30';
    return 'bg-red-50/10 hover:bg-red-50/30';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* Header and subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-blue-900">Inventory Expiry Sweeper</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Monitor batches nearing or past their expiry, log disposals, or override search visibilities.
          </p>
        </div>

        {/* Read-only notification badge for staff */}
        {!isAdmin && (
          <span className="bg-gray-150 border border-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg select-none">
            Staff View: Read-Only Access
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-2 mb-6 text-sm text-red-800 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Expiry Sweeper Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Expired count */}
        <div className="bg-white border border-red-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-red-650">{expiredList.length}</p>
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5">Expired Batches</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <BadgeAlert className="w-5 h-5 text-red-650" />
          </div>
        </div>

        {/* Near Expiry count */}
        <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-amber-650">{nearExpiryList.length}</p>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-0.5">Near Expiry (≤30 Days)</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-650" />
          </div>
        </div>

        {/* Expiring Soon count */}
        <div className="bg-white border border-yellow-250 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-yellow-650">{expiringSoonList.length}</p>
            <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider mt-0.5">Expiring Soon (31-90 Days)</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-yellow-650" />
          </div>
        </div>

        {/* Value at Risk */}
        <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-black text-blue-800">{formatCurrency(valueAtRisk)}</p>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">Stock Value At Risk</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Tabs list switcher */}
      <div className="flex border-b border-gray-200 gap-1.5 mb-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('expired')}
          className={`py-3 px-4 border-b-2 transition-all ${
            activeTab === 'expired'
              ? 'border-red-500 text-red-700 bg-red-50/5 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-red-600'
          }`}
        >
          Expired ({expiredList.length})
        </button>
        <button
          onClick={() => setActiveTab('near')}
          className={`py-3 px-4 border-b-2 transition-all ${
            activeTab === 'near'
              ? 'border-amber-500 text-amber-700 bg-amber-50/5 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-amber-600'
          }`}
        >
          Near Expiry ({nearExpiryList.length})
        </button>
        <button
          onClick={() => setActiveTab('soon')}
          className={`py-3 px-4 border-b-2 transition-all ${
            activeTab === 'soon'
              ? 'border-yellow-500 text-yellow-750 bg-yellow-50/5 font-extrabold'
              : 'border-transparent text-gray-500 hover:text-yellow-600'
          }`}
        >
          Expiring Soon ({expiringSoonList.length})
        </button>
      </div>

      {/* Active Tab Grid Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            Generating stock expiry lists...
          </div>
        ) : getActiveList().length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-gray-500">
              <thead className="bg-gray-55/60 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-blue-900">
                <tr>
                  <th scope="col" className="px-6 py-4">Medicine Specifications</th>
                  <th scope="col" className="px-4 py-4 text-center">Batch Number</th>
                  <th scope="col" className="px-4 py-4 text-center">Rack Cabinet</th>
                  <th scope="col" className="px-4 py-4 text-center">Stock Count</th>
                  <th scope="col" className="px-4 py-4 text-right">Value (At Selling Price)</th>
                  <th scope="col" className="px-4 py-4 text-center">Expiry Date</th>
                  <th scope="col" className="px-4 py-4 text-center">Status</th>
                  {isAdmin && <th scope="col" className="px-6 py-4 text-right">Admin Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getActiveList().map((p) => {
                  const itemValue = (p.sellingPrice || 0) * (p.stock || 0);
                  const expiryDateObj = p.expiryDate ? new Date(p.expiryDate) : null;
                  
                  return (
                    <tr
                      key={p._id}
                      className={`transition-colors ${getRowClass()}`}
                    >
                      {/* Name Specifications */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-gray-800">{p.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">
                            {p.brand}
                          </span>
                        </div>
                      </td>

                      {/* Batch */}
                      <td className="px-4 py-4 text-center font-bold text-gray-700">
                        {p.batchNumber || 'N/A'}
                      </td>

                      {/* Rack Cabinet */}
                      <td className="px-4 py-4 text-center font-medium text-gray-500">
                        {p.rackLocation || 'Shelf-1'}
                      </td>

                      {/* Stock Count */}
                      <td className="px-4 py-4 text-center">
                        <span className="font-black text-gray-800 bg-gray-50 border border-gray-200 py-1 px-3.5 rounded-lg">
                          {p.stock}
                        </span>
                      </td>

                      {/* Selling Price Value */}
                      <td className="px-4 py-4 text-right font-black text-blue-800">
                        {formatCurrency(itemValue)}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-4 text-center">
                        <span className="font-extrabold text-gray-800">
                          {expiryDateObj ? expiryDateObj.toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }) : 'N/A'}
                        </span>
                      </td>

                      {/* Status visibility info */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          {p.isHidden ? (
                            <span className="bg-gray-150 border border-gray-200 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
                              Hidden
                            </span>
                          ) : (
                            <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
                              Visible
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle visibility */}
                            <button
                              onClick={() => handleToggleVisibility(p._id, p.isHidden, p.name)}
                              title={p.isHidden ? 'Show in Customer Portal' : 'Hide from Customer Portal'}
                              className="p-1.5 rounded border border-gray-200 bg-white hover:border-blue-300 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              {p.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>

                            {/* Mark Disposed and Soft Delete */}
                            <button
                              onClick={() => handleMarkDisposed(p._id, p.name)}
                              title="Mark Disposed & Soft Delete"
                              className="p-1.5 rounded border border-gray-200 bg-white hover:border-red-300 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-gray-400">
            No medicine batches match this category at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
