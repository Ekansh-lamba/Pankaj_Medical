import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload, Trash2, Edit, Search, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';
import RxBadge from '../../components/shared/RxBadge';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Standard utility to verify if an expiry Date falls in the "Expiring Soon" category (31 to 90 days from now)
 */
function checkExpiringSoon(expiryDateStr) {
  if (!expiryDateStr) return false;
  const expiry = new Date(expiryDateStr);
  const today = new Date();
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 30 && diffDays <= 90;
}

/**
 * Admin Product Inventory Management Board
 */
export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchAdminProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Query `/api/products` which returns all items including hidden/inactive to admins
      const response = await api.get('/api/products', {
        params: { limit: 100 } // Fetch more rows for list
      });
      if (response.data && response.data.success) {
        setProducts(response.data.data.products);
      }
    } catch (err) {
      console.error('Failed to load admin products:', err);
      setError('Failed to fetch the inventory list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProducts();
  }, []);

  const handleDeactivate = async (id, name) => {
    const confirm = window.confirm(`Are you absolutely sure you want to deactivate and soft-delete: "${name}"?`);
    if (!confirm) return;

    try {
      const response = await api.delete(`/api/products/${id}`);
      if (response.data && response.data.success) {
        alert(`${name} deactivated successfully.`);
        fetchAdminProducts(); // Refresh list
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert(err.response?.data?.message || 'Failed to deactivate product.');
    }
  };

  const handleToggleVisibility = async (id, currentHidden, name) => {
    const actionText = currentHidden ? 'show' : 'hide';
    const reason = window.prompt(`Enter a reason to ${actionText} "${name}" in client portal:`, 'Manual visibility override');
    if (reason === null) return; // cancelled

    try {
      const response = await api.put(`/api/products/${id}/toggle-visibility`, {
        isHidden: !currentHidden,
        reason
      });
      if (response.data && response.data.success) {
        alert(`Visibility updated successfully.`);
        fetchAdminProducts();
      }
    } catch (err) {
      console.error('Error toggling visibility:', err);
      alert(err.response?.data?.message || 'Failed to override visibility.');
    }
  };

  // Client-side search and category filtering for high responsiveness
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.composition && p.composition.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.batchNumber && p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-teal-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Add, modify, sweep, or upload pharmacy stock lists.</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
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

      {/* Internal Search and Filter controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, brand, or batch..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full md:max-w-xs border border-gray-300 rounded-lg text-sm bg-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        >
          <option value="">All Categories</option>
          <option value="Tablets & Capsules">Tablets & Capsules</option>
          <option value="Syrups & Liquids">Syrups & Liquids</option>
          <option value="Injections">Injections</option>
          <option value="Surgical & Devices">Surgical & Devices</option>
          <option value="Vitamins & Supplements">Vitamins & Supplements</option>
          <option value="Baby Care">Baby Care</option>
          <option value="Personal Care">Personal Care</option>
          <option value="Ayurvedic & Herbal">Ayurvedic & Herbal</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-2 mb-6 text-sm text-red-800 font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Table view list */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
            <span className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2"></span>
            Loading stock details...
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-gray-500">
              <thead className="bg-gray-55/60 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-teal-900">
                <tr>
                  <th scope="col" className="px-6 py-4">Medicine Specifications</th>
                  <th scope="col" className="px-4 py-4">Category</th>
                  <th scope="col" className="px-4 py-4 text-center">Rx Class</th>
                  <th scope="col" className="px-4 py-4 text-right">Pricing (MRP/Sell)</th>
                  <th scope="col" className="px-4 py-4 text-center">Stock</th>
                  <th scope="col" className="px-4 py-4 text-center">Expiry</th>
                  <th scope="col" className="px-4 py-4 text-center">Status Indicators</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((p) => {
                  const isLowStock = p.stock <= p.lowStockThreshold;
                  const isExpSoon = checkExpiringSoon(p.expiryDate);
                  const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();
                  
                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-teal-50/10 transition-colors ${
                        !p.isActive ? 'bg-gray-50/50 opacity-70' : ''
                      }`}
                    >
                      {/* Name Specifications */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-gray-800">{p.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">
                            {p.brand} &bull; {p.form} &bull; {p.batchNumber || 'No Batch'}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4 font-semibold text-gray-700">{p.category}</td>

                      {/* Rx Class */}
                      <td className="px-4 py-4 text-center">
                        {p.rxType === 'OTC' ? (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OTC</span>
                        ) : (
                          <RxBadge rxType={p.rxType} />
                        )}
                      </td>

                      {/* Pricing */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-teal-800">{formatCurrency(p.sellingPrice)}</span>
                          <span className="text-xs text-gray-400 line-through">{formatCurrency(p.mrp)}</span>
                        </div>
                      </td>

                      {/* Stock count */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-gray-700'}`}>
                            {p.stock}
                          </span>
                          {isLowStock && (
                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Low Stock</span>
                          )}
                        </div>
                      </td>

                      {/* Expiry date */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-medium ${isExpired ? 'text-red-600 font-bold' : isExpSoon ? 'text-amber-600 font-bold' : 'text-gray-700'}`}>
                            {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }) : 'No Date'}
                          </span>
                          {isExpired ? (
                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-0.5">
                              Expired
                            </span>
                          ) : isExpSoon ? (
                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-0.5">
                              Soon
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {p.isActive ? (
                            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-100 uppercase tracking-wider">
                              Active
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wider">
                              Inactive
                            </span>
                          )}
                          
                          {p.isHidden ? (
                            <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wider flex items-center gap-0.5">
                              Hidden
                            </span>
                          ) : (
                            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-100 uppercase tracking-wider flex items-center gap-0.5">
                              Visible
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle visibility */}
                          <button
                            onClick={() => handleToggleVisibility(p._id, p.isHidden, p.name)}
                            disabled={!p.isActive}
                            title={p.isHidden ? 'Show in Customer Portal' : 'Hide from Customer Portal'}
                            className={`p-1.5 rounded border transition-colors ${
                              !p.isActive
                                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                : 'border-gray-200 hover:border-teal-300 text-gray-400 hover:text-teal-600'
                            }`}
                          >
                            {p.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>

                          {/* Edit Product */}
                          <Link
                            to={`/admin/products/edit/${p._id}`}
                            className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-teal-600 hover:border-teal-300 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {/* Soft Delete */}
                          <button
                            onClick={() => handleDeactivate(p._id, p.name)}
                            disabled={!p.isActive}
                            className={`p-1.5 rounded border transition-colors ${
                              !p.isActive
                                ? 'border-gray-150 text-gray-300 cursor-not-allowed'
                                : 'border-gray-250 text-gray-400 hover:text-red-600 hover:border-red-300'
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
            No products found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
