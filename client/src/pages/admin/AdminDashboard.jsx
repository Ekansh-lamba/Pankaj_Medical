import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  Pill,
  FileUp,
  Clock,
  ShoppingCart,
  FileText,
  Users,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import toast from 'react-hot-toast';

// Quick Action links for the side panel / bottom bar
const QUICK_ACTIONS = [
  {
    label: 'Product Catalogue',
    desc: 'Manage inventory items.',
    icon: Pill,
    path: '/admin/products',
    color: 'teal'
  },
  {
    label: 'Import spreadsheet',
    desc: 'PO/Catalogue spreadsheet ingest.',
    icon: FileUp,
    path: '/admin/products/import',
    color: 'teal'
  },
  {
    label: 'Expiry Monitor',
    desc: 'Sweep date boundaries.',
    icon: Clock,
    path: '/admin/expiry',
    color: 'amber'
  },
  {
    label: 'Staff Management',
    desc: 'Invite and govern accounts.',
    icon: Users,
    path: '/admin/staff',
    color: 'indigo'
  },
  {
    label: 'Store Settings',
    desc: 'Pincodes & working hours.',
    icon: SettingsIcon,
    path: '/admin/settings',
    color: 'slate'
  }
];

const COLOR_MAP = {
  teal: 'bg-blue-50 text-blue-700 hover:border-blue-300',
  amber: 'bg-amber-50 text-amber-700 hover:border-amber-300',
  indigo: 'bg-indigo-50 text-indigo-700 hover:border-indigo-300',
  slate: 'bg-slate-50 text-slate-700 hover:border-slate-300'
};

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, revRes, catRes, prodRes] = await Promise.all([
        api.get('/api/admin/analytics/summary'),
        api.get('/api/admin/analytics/revenue'),
        api.get('/api/admin/analytics/categories'),
        api.get('/api/admin/analytics/top-products')
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (revRes.data.success) setRevenueData(revRes.data.data);
      if (catRes.data.success) setCategoryData(catRes.data.data);
      if (prodRes.data.success) setTopProducts(prodRes.data.data);
    } catch (err) {
      console.error('Failed to load analytics dashboard:', err);
      setError('Failed to fetch store analytics reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    // Generate token-backed direct export URL
    const token = localStorage.getItem('token');
    const exportUrl = `${api.defaults.baseURL || 'http://localhost:5000'}/api/admin/analytics/export-csv?token=${token}`;
    window.open(exportUrl, '_blank');
    toast.success('Sales report CSV download initiated.');
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
        <span className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        Compiling business intelligence reports...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col items-center text-center gap-3">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <h3 className="font-extrabold text-red-900">Analytics Loading Failed</h3>
          <p className="text-xs text-red-700 max-w-sm">{error}</p>
          <button onClick={fetchAnalytics} className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 mt-2">
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8 font-sans">
      
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-blue-900">
            Operations & Analytics Control
          </h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">
            Welcome back, {user?.name || 'Administrator'} 👋 &bull; Role: Admin
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs py-2.5 px-4 font-extrabold rounded-lg border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Sales Report (CSV)
          </button>
        </div>
      </div>

      {/* ── KPI Widgets Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Sales (Paid)</span>
            <h2 className="text-base md:text-lg font-black text-blue-900 mt-0.5">
              {formatCurrency(summary?.totalRevenue || 0)}
            </h2>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Orders</span>
            <h2 className="text-base md:text-lg font-black text-gray-800 mt-0.5">
              {summary?.totalOrders?.toLocaleString() || 0}
            </h2>
          </div>
        </div>

        {/* Total Active Products */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Package className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Catalogue</span>
            <h2 className="text-base md:text-lg font-black text-gray-800 mt-0.5">
              {summary?.totalProducts?.toLocaleString() || 0}
            </h2>
          </div>
        </div>

        {/* Awaiting Store Approvals */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
            <FileText className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Awaiting Store Approval</span>
            <h2 className={`text-base md:text-lg font-black mt-0.5 ${summary?.pendingPrescriptions > 0 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
              {summary?.pendingPrescriptions || 0}
            </h2>
          </div>
        </div>
      </div>

      {/* ── Charts Workstation ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle: 30-Day Revenue Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">30-Day Sales Trend</h3>
            <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-black uppercase">Paid Orders Only</span>
          </div>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} />
                <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Category Products Share (Bar Chart) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Catalogue Category Share</h3>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tickLine={false} width={80} />
                <Tooltip formatter={(value) => [value, 'Products']} />
                <Bar dataKey="value" fill="#0f766e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Top Selling Products & Quick Actions ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle: Top Selling Products */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-500 border-collapse">
              <thead>
                <tr className="bg-slate-50 font-bold uppercase tracking-wider text-blue-900 border-b border-gray-200">
                  <th className="px-4 py-3">Medicine Name</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3 text-center">Quantity Sold</th>
                  <th className="px-4 py-3 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.length > 0 ? (
                  topProducts.map((p, idx) => (
                    <tr key={p._id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-extrabold text-gray-800">{p.name}</td>
                      <td className="px-4 py-3.5 uppercase text-[10px] tracking-wider font-semibold text-gray-400">{p.brand}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-gray-700">{p.quantitySold}</td>
                      <td className="px-4 py-3.5 text-right font-black text-blue-800">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-400 italic">No sales transactions processed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Administration Links</h3>
          <div className="flex flex-col gap-2.5">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.path}
                  to={a.path}
                  style={{ textDecoration: 'none' }}
                  className={`flex items-center justify-between p-3 border border-gray-200 rounded-xl transition-all ${COLOR_MAP[a.color]}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/70 rounded-lg shadow-xs">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-extrabold text-gray-800">{a.label}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* ── System Info Strip ──────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-2xl p-4 flex flex-wrap gap-x-8 gap-y-2 text-[10px] font-mono text-slate-400 shadow-sm items-center">
        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> SYSTEM ONLINE</span>
        <span>OPERATOR: <span className="text-slate-200 uppercase">{user?.email || 'N/A'}</span></span>
        <span>HOST IP: <span className="text-slate-200">127.0.0.1</span></span>
      </div>

    </div>
  );
}
