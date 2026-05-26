import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Upload, Trash2, Edit, Search, AlertCircle,
  Eye, EyeOff, CheckSquare, Square, ChevronDown,
  Zap, Filter, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import RxBadge from '../../components/shared/RxBadge';
import { formatCurrency } from '../../utils/formatCurrency';

function checkExpiringSoon(expiryDateStr) {
  if (!expiryDateStr) return false;
  const expiry = new Date(expiryDateStr);
  const today = new Date();
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  return diffDays > 30 && diffDays <= 90;
}

export default function Products() {
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [bulkLoading, setBulkLoading]     = useState(false);

  // Filters
  const [searchTerm, setSearchTerm]       = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [bulkDropOpen, setBulkDropOpen]   = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchAdminProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/products', { params: { limit: 5000 } });
      if (response.data?.success) {
        setProducts(response.data.data.products);
        setSelectedIds(new Set()); // Clear selection on refresh
      }
    } catch (err) {
      console.error('Failed to load admin products:', err);
      setError('Failed to fetch the inventory list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdminProducts(); }, [fetchAdminProducts]);

  // ── Client-side filters ───────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.composition && p.composition.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.batchNumber && p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    const matchesActive   = !showInactiveOnly || !p.isActive;
    return matchesSearch && matchesCategory && matchesActive;
  });

  // ── Row-level actions ─────────────────────────────────────────────────────
  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate and soft-delete: "${name}"?`)) return;
    try {
      const res = await api.delete(`/api/products/${id}`);
      if (res.data?.success) { toast.success(`${name} deactivated.`); fetchAdminProducts(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleToggleVisibility = async (id, currentHidden, name) => {
    const actionText = currentHidden ? 'show' : 'hide';
    const reason = window.prompt(`Reason to ${actionText} "${name}":`, 'Manual override');
    if (reason === null) return;
    try {
      const res = await api.put(`/api/products/${id}/toggle-visibility`, { isHidden: !currentHidden, reason });
      if (res.data?.success) { toast.success('Visibility updated.'); fetchAdminProducts(); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  // ── Selection logic ───────────────────────────────────────────────────────
  const allVisibleIds    = filteredProducts.map(p => p._id);
  const allSelected      = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id));
  const someSelected     = allVisibleIds.some(id => selectedIds.has(id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => { const n = new Set(prev); allVisibleIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); allVisibleIds.forEach(id => n.add(id)); return n; });
    }
  };

  const toggleRow = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // ── Bulk actions ──────────────────────────────────────────────────────────
  const runBulkAction = async (action) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkLoading(true);
    setBulkDropOpen(false);
    try {
      const res = await api.put('/api/products/bulk-action', { ids, action });
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchAdminProducts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk action failed.');
    } finally {
      setBulkLoading(false);
    }
  };

  const runActivateAll = async () => {
    if (!window.confirm('Activate ALL inactive products? This will make them visible in the customer store.')) return;
    setBulkLoading(true);
    try {
      const res = await api.put('/api/products/bulk-activate-all');
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchAdminProducts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate all.');
    } finally {
      setBulkLoading(false);
    }
  };

  const inactiveCount = products.filter(p => !p.isActive).length;
  const selectedCount = selectedIds.size;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-teal-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            {products.length.toLocaleString()} products total
            {inactiveCount > 0 && (
              <span className="ml-2 text-amber-600 font-bold">· {inactiveCount} inactive</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* Activate All Inactive — prominent when there are inactive products */}
          {inactiveCount > 0 && (
            <button
              onClick={runActivateAll}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs py-2 px-4 font-bold rounded-lg border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors shadow-xs disabled:opacity-60"
            >
              <Zap className="w-3.5 h-3.5" />
              Activate All Inactive ({inactiveCount})
            </button>
          )}
          <Link
            to="/admin/products/import"
            style={{ textDecoration: 'none' }}
            className="btn-teal-outline flex items-center gap-1.5 text-xs py-2 px-4 shadow-xs"
          >
            <Upload className="w-4 h-4 text-teal-700" /> Bulk CSV Import
          </Link>
          <Link
            to="/admin/products/add"
            style={{ textDecoration: 'none' }}
            className="btn-teal flex items-center gap-1.5 text-xs py-2 px-4 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add New Medicine
          </Link>
        </div>
      </div>

      {/* ── Filters row ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-xs flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-grow min-w-[180px] max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, brand, batch..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg text-sm bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All Categories</option>
          <option value="Tablets &amp; Capsules">Tablets &amp; Capsules</option>
          <option value="Syrups &amp; Liquids">Syrups &amp; Liquids</option>
          <option value="Injections">Injections</option>
          <option value="Surgical &amp; Devices">Surgical &amp; Devices</option>
          <option value="Vitamins &amp; Supplements">Vitamins &amp; Supplements</option>
          <option value="Baby Care">Baby Care</option>
          <option value="Personal Care">Personal Care</option>
          <option value="Ayurvedic &amp; Herbal">Ayurvedic &amp; Herbal</option>
        </select>

        {/* Inactive-only toggle */}
        <button
          onClick={() => setShowInactiveOnly(v => !v)}
          className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg border transition-colors ${
            showInactiveOnly
              ? 'bg-amber-100 border-amber-400 text-amber-800'
              : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Inactive Only {showInactiveOnly && `(${filteredProducts.length})`}
        </button>

        {/* Refresh */}
        <button
          onClick={fetchAdminProducts}
          disabled={loading}
          className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-teal-600 hover:border-teal-300 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <span className="text-xs text-gray-400 ml-auto">{filteredProducts.length.toLocaleString()} shown</span>
      </div>

      {/* ── Bulk action toolbar (appears when rows are selected) ───────── */}
      {selectedCount > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3 shadow-xs">
          <span className="text-sm font-bold text-teal-800">{selectedCount} selected</span>

          {/* Bulk action dropdown */}
          <div className="relative">
            <button
              onClick={() => setBulkDropOpen(v => !v)}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg border border-teal-300 bg-white text-teal-700 hover:bg-teal-50 transition-colors disabled:opacity-60"
            >
              Bulk Action <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {bulkDropOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] overflow-hidden">
                <button
                  onClick={() => runBulkAction('activate')}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  ✓ Activate Selected
                </button>
                <button
                  onClick={() => runBulkAction('deactivate')}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                >
                  ✗ Deactivate Selected
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-gray-400 hover:text-gray-600 ml-auto"
          >
            Clear selection
          </button>

          {bulkLoading && (
            <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-2 mb-4 text-sm text-red-800 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
            <span className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
            Loading stock details...
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-gray-500">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-teal-900">
                <tr>
                  {/* Select-all checkbox */}
                  <th className="px-4 py-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-teal-600 hover:text-teal-800 transition-colors"
                      title={allSelected ? 'Deselect all' : 'Select all visible'}
                    >
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : someSelected ? (
                        <CheckSquare className="w-4 h-4 opacity-50" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-4">Medicine Specifications</th>
                  <th scope="col" className="px-4 py-4">Category</th>
                  <th scope="col" className="px-4 py-4 text-center">Rx Class</th>
                  <th scope="col" className="px-4 py-4 text-right">Pricing</th>
                  <th scope="col" className="px-4 py-4 text-center">Stock</th>
                  <th scope="col" className="px-4 py-4 text-center">Expiry</th>
                  <th scope="col" className="px-4 py-4 text-center">Status</th>
                  <th scope="col" className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const isLowStock  = p.stock <= p.lowStockThreshold;
                  const isExpSoon   = checkExpiringSoon(p.expiryDate);
                  const isExpired   = p.expiryDate && new Date(p.expiryDate) < new Date();
                  const isSelected  = selectedIds.has(p._id);

                  return (
                    <tr
                      key={p._id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-teal-50/60'
                          : !p.isActive
                          ? 'bg-amber-50/30 opacity-80'
                          : 'hover:bg-gray-50/60'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(p._id)}
                          className="text-teal-600 hover:text-teal-800 transition-colors"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-gray-300 hover:text-gray-400" />}
                        </button>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-gray-800">{p.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">
                            {p.brand} &bull; {p.form} &bull; {p.batchNumber || 'No Batch'}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 font-semibold text-gray-700 text-xs">{p.category}</td>

                      {/* Rx Class */}
                      <td className="px-4 py-3 text-center">
                        {p.rxType === 'OTC' ? (
                          <span className="text-[10px] font-bold text-gray-400 uppercase">OTC</span>
                        ) : (
                          <RxBadge rxType={p.rxType} />
                        )}
                      </td>

                      {/* Pricing */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-teal-800">{formatCurrency(p.sellingPrice)}</span>
                          <span className="text-xs text-gray-400 line-through">{formatCurrency(p.mrp)}</span>
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>{p.stock}</span>
                          {isLowStock && <span className="text-[9px] font-bold text-red-500 uppercase">Low</span>}
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium text-xs ${isExpired ? 'text-red-600 font-bold' : isExpSoon ? 'text-amber-600 font-bold' : 'text-gray-600'}`}>
                          {p.expiryDate
                            ? new Date(p.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' })
                            : '—'}
                        </span>
                        {isExpired && <div className="text-[9px] font-bold text-red-500 uppercase">Expired</div>}
                        {isExpSoon && !isExpired && <div className="text-[9px] font-bold text-amber-500 uppercase">Soon</div>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {p.isActive ? (
                            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-100 uppercase">Active</span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 uppercase">Inactive</span>
                          )}
                          {p.isHidden ? (
                            <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 uppercase">Hidden</span>
                          ) : (
                            <span className="bg-teal-50 text-teal-600 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-100 uppercase">Visible</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleVisibility(p._id, p.isHidden, p.name)}
                            disabled={!p.isActive}
                            title={p.isHidden ? 'Show in store' : 'Hide from store'}
                            className={`p-1.5 rounded border transition-colors ${
                              !p.isActive ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-200 hover:border-teal-300 text-gray-400 hover:text-teal-600'
                            }`}
                          >
                            {p.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          <Link
                            to={`/admin/products/edit/${p._id}`}
                            className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-teal-600 hover:border-teal-300 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDeactivate(p._id, p.name)}
                            disabled={!p.isActive}
                            className={`p-1.5 rounded border transition-colors ${
                              !p.isActive ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-gray-400">
            No products found matching your filters.
          </div>
        )}
      </div>

      {/* Click outside to close bulk dropdown */}
      {bulkDropOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setBulkDropOpen(false)} />
      )}
    </div>
  );
}
