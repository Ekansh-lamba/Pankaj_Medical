import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  User, Mail, Phone, Pill, ShoppingCart,
  ClipboardList, UserCircle, Trash2, ShieldAlert,
  FileText, MapPin, CheckCircle, ArrowRight, Loader2
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QUICK_ACTIONS = [
  {
    to: '/products',
    label: 'Browse Medicines',
    description: 'Search & order from our full catalogue',
    Icon: Pill,
    bg: 'bg-blue-50 hover:bg-blue-100/70',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-800',
  },
  {
    to: '/my-orders',
    label: 'My Orders',
    description: 'Track and manage your order history',
    Icon: ClipboardList,
    bg: 'bg-indigo-50 hover:bg-indigo-100/70',
    border: 'border-indigo-200',
    icon: 'text-indigo-600',
    text: 'text-indigo-800',
  },
  {
    to: '/cart',
    label: 'My Cart',
    description: 'Review items and proceed to checkout',
    Icon: ShoppingCart,
    bg: 'bg-sky-50 hover:bg-sky-100/70',
    border: 'border-sky-200',
    icon: 'text-sky-600',
    text: 'text-sky-800',
  },
  {
    to: '/profile',
    label: 'My Profile',
    description: 'Manage addresses and account settings',
    Icon: UserCircle,
    bg: 'bg-violet-50 hover:bg-violet-100/70',
    border: 'border-violet-200',
    icon: 'text-violet-600',
    text: 'text-violet-800',
  },
];

export default function CustomerDashboard() {
  const { user, softDeleteUserAccount, isLoading: authLoading } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Dynamic Dashboard States
  const [recentOrders, setRecentOrders] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch addresses and orders on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch saved addresses
        const profileRes = await api.get('/api/users/profile');
        if (profileRes.data && profileRes.data.success) {
          setSavedAddresses(profileRes.data.data.addresses || []);
        }

        // 2. Fetch orders (last 20 to scan for prescriptions)
        const ordersRes = await api.get('/api/orders/my-orders?page=1&limit=20');
        if (ordersRes.data && ordersRes.data.success) {
          const allOrders = ordersRes.data.data.orders || [];
          setRecentOrders(allOrders.slice(0, 3));

          // Scan and compile prescriptions list
          const rxList = [];
          allOrders.forEach(order => {
            if (order.prescriptions && order.prescriptions.length > 0) {
              order.prescriptions.forEach(rx => {
                rxList.push({
                  ...rx,
                  orderId: order._id,
                  orderNumber: order.orderNumber || order._id.slice(-6).toUpperCase()
                });
              });
            }
          });

          // Sort prescriptions by date descending
          rxList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setPrescriptions(rxList);
        }
      } catch (err) {
        console.error('Failed to retrieve customer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleDeleteAccount = async () => {
    try {
      await softDeleteUserAccount();
      toast.success('Your account was successfully deleted.');
    } catch {
      toast.error('Failed to process account deletion.');
    }
  };

  const resendVerification = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const res = await api.post('/api/auth/resend-verification');
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Verification email has been resent!');
      } else {
        toast.error(res.data.message || 'Failed to resend verification email.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const getStatusBadgeClass = (status = '') => {
    const s = status.toLowerCase();
    if (['pending_payment', 'pending_approval'].includes(s)) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (['confirmed', 'processing', 'packed', 'shipped'].includes(s)) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'delivered') return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const formatStatus = (status = '') => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-6 font-sans bg-slate-50 min-h-screen">
      
      {/* Verification Banner */}
      {user && !user.isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3 shadow-sm">
          <ShieldAlert className="text-amber-500 w-5 h-5 shrink-0" />
          <span className="text-amber-800 text-xs font-semibold">
            Please verify your email address to place orders.
            <button
              onClick={resendVerification}
              disabled={isResending}
              className="ml-2 underline font-black hover:text-amber-900 transition-colors"
            >
              {isResending ? 'Resending...' : 'Resend verification email'}
            </button>
          </span>
        </div>
      )}

      {/* Welcome Card & Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-black text-slate-900 truncate">
              Welcome back, {user?.name?.split(' ')[0] || 'Customer'}!
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage generic medicines, prescriptions & home deliveries</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-center gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600">
            <Mail className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="min-w-0 truncate">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Registered Email</span>
              <span className="font-semibold text-slate-800 truncate block">{user?.email || 'N/A'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <Phone className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Mobile Phone</span>
              <span className="font-semibold text-slate-800 block">{user?.phone || 'Not configured'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="mb-8">
        <h2 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map(({ to, label, description, Icon, bg, border, icon, text }) => (
            <Link
              key={to}
              to={to}
              style={{ textDecoration: 'none' }}
              className={`bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-all hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]`}
            >
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center border ${border} transition-colors shrink-0`}>
                <Icon className={`w-5 h-5 ${icon}`} />
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-black ${text}`}>{label}</div>
                <div className="text-[9px] text-slate-500 font-semibold leading-tight mt-0.5 truncate max-w-[170px]">{description}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Dashboard Widget Matrix */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          Loading account data...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Main Widgets (Orders & Prescriptions) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Recent Orders */}
            <div className="card-base p-6 shadow-xs bg-white">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-blue-600" /> Recent Orders
                </h3>
                {recentOrders.length > 0 && (
                  <Link to="/my-orders" className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-0.5">
                    View History <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {recentOrders.length > 0 ? (
                <div className="space-y-3.5">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="border border-slate-150 rounded-xl p-4 hover:border-slate-350 transition-colors bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-800 text-sm">
                            #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadgeClass(order.status)}`}>
                            {formatStatus(order.status)}
                          </span>
                        </div>
                        <p className="text-slate-400 font-semibold text-[10px]">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right text-xs">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Amount</span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            ₹{order.totalAmount?.toFixed(2)}
                          </span>
                        </div>
                        <Link
                          to={`/my-orders/${order._id}`}
                          className="btn-secondary text-[11px] font-bold py-1.5 px-4 shrink-0 shadow-xs"
                          style={{ textDecoration: 'none' }}
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                  <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
                  <p className="text-xs text-slate-500 font-bold">You haven't placed any orders yet</p>
                  <p className="text-[10px] text-slate-400 mt-1 mb-4">Add health items to your cart to checkout</p>
                  <Link to="/products" className="btn-primary py-2 px-5 text-xs font-bold shadow-xs">
                    Browse Medicines
                  </Link>
                </div>
              )}
            </div>

            {/* My Prescriptions */}
            <div className="card-base p-6 shadow-xs bg-white">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" /> My Prescriptions
                </h3>
              </div>

              {prescriptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prescriptions.slice(0, 4).map((rx) => (
                    <div key={rx._id} className="border border-slate-150 rounded-xl p-3.5 bg-slate-50/50 flex flex-col justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[9px] font-black text-blue-800 uppercase bg-blue-100/50 px-2 py-0.5 rounded">
                            Order #{rx.orderNumber}
                          </span>
                          <span className={`text-[8px] font-black border px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            rx.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            rx.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {rx.status || 'Pending'}
                          </span>
                        </div>
                        <p className="text-slate-450 font-bold text-[10px]">
                          Uploaded {new Date(rx.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      <div className="flex justify-end pt-1 border-t border-slate-100">
                        <a
                          href={rx.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-extrabold flex items-center gap-0.5"
                        >
                          View Document <ArrowRight className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-bold">No prescription uploads found</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-normal max-w-sm mx-auto">
                    Prescriptions uploaded during order checkout will appear here for batch audits.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column (Addresses & Danger Zone) */}
          <div className="space-y-8">
            
            {/* Saved Addresses */}
            <div className="card-base p-6 shadow-xs bg-white">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" /> Saved Addresses
                </h3>
                <Link to="/profile" className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline">
                  Manage
                </Link>
              </div>

              {savedAddresses.length > 0 ? (
                <div className="space-y-3">
                  {savedAddresses.slice(0, 2).map((addr) => (
                    <div
                      key={addr._id}
                      className={`p-3 border rounded-xl relative text-xs ${
                        addr.isDefault
                          ? 'border-blue-400 bg-blue-50/20'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-black text-blue-800 uppercase bg-blue-100/50 px-2 py-0.5 rounded">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[8px] font-black text-green-700 uppercase bg-green-100 px-2 py-0.5 rounded flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5 text-green-600" /> Default
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-700 leading-normal truncate">
                        {addr.line1}
                      </p>
                      {addr.line2 && (
                        <p className="text-[11px] font-semibold text-slate-450 leading-normal truncate">
                          {addr.line2}
                        </p>
                      )}
                      <p className="font-bold text-slate-500 mt-1 text-[10px]">
                        {addr.city}, {addr.pinCode}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                  <MapPin className="w-6.5 h-6.5 text-slate-350 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-bold">No saved addresses</p>
                  <Link to="/profile" className="text-[10px] text-blue-600 hover:underline font-bold mt-1 block">
                    + Add delivery address
                  </Link>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="border border-red-200 rounded-xl p-5 bg-white shadow-xs">
              <h3 className="text-xs font-black text-red-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="text-red-600 w-4.5 h-4.5 shrink-0" /> Danger Zone
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mb-3">
                Permanently anonymize name, phone, and addresses.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Account
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-slate-800">Confirm Account Deletion</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your email, phone, name, and address data will be anonymized. This action is
              permanent and cannot be reversed.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-white text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={authLoading}
                className="btn-primary bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3 text-white"
              >
                {authLoading ? 'Processing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
