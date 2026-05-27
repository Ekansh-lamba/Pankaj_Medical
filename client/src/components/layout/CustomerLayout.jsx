import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import {
  Landmark, Home, Pill, ShoppingCart, ClipboardList,
  User, LogOut, Bell, Menu, X
} from 'lucide-react';
import NotificationBell from '../shared/NotificationBell';
import api from '../../services/api';

const NAV_LINKS = [
  { to: '/',                 label: 'Home',     Icon: Home },
  { to: '/products',         label: 'Medicines', Icon: Pill },
  { to: '/cart',             label: 'Cart',      Icon: ShoppingCart, showBadge: true },
  { to: '/my-orders',        label: 'Orders',    Icon: ClipboardList },
  { to: '/profile',          label: 'Profile',   Icon: User },
];

export default function CustomerLayout() {
  const { user, logoutUser, isAuthenticated } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  const itemCount = useCartStore(s =>
    (s.items || []).reduce((sum, i) => sum + i.quantity, 0)
  );
  const location = useLocation();

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/api/notifications/unread-count');
      if (res.data && res.data.success) {
        setUnreadNotifications(res.data.data.count);
      }
    } catch (err) {
      console.error('Fetch unread notifications count failed:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">

      {/* ── Desktop top navbar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 hidden md:block bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">
          {/* Brand */}
          <Link
            to="/"
            style={{ textDecoration: 'none' }}
            className="flex items-center gap-2 text-teal-700 font-extrabold text-base shrink-0 mr-2"
          >
            <Landmark className="w-5 h-5" />
            <span>Pankaj Medical</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 flex-grow">
            {NAV_LINKS.map(({ to, label, Icon, showBadge }) => (
              <Link
                key={to}
                to={to}
                style={{ textDecoration: 'none' }}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive(to)
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-500 hover:text-teal-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {showBadge && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <NotificationBell />
            <div className="flex items-center gap-1.5 text-sm text-gray-600 font-semibold px-3 py-1.5 bg-gray-100 rounded-lg max-w-[140px] truncate">
              <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="truncate">{user?.name?.split(' ')[0] || 'Account'}</span>
            </div>
            <button
              onClick={() => logoutUser()}
              className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile top bar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 md:hidden bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link
              to="/"
              style={{ textDecoration: 'none' }}
              className="flex items-center gap-1.5 text-teal-700 font-extrabold text-base"
            >
              <Landmark className="w-5 h-5" />
              Pankaj Medical
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <Link
              to="/cart"
              style={{ textDecoration: 'none' }}
              className="relative p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-teal-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile slide-in sidebar navigation ────────────────────────────── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 md:hidden animate-fadeIn"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 bottom-0 left-0 w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out md:hidden flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-6 border-b border-gray-150 flex items-center justify-between shrink-0">
          <Link
            to="/"
            onClick={() => setIsSidebarOpen(false)}
            style={{ textDecoration: 'none' }}
            className="flex items-center gap-2 text-teal-700 font-extrabold text-base"
          >
            <Landmark className="w-5 h-5" />
            <span>Pankaj Medical</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-gray-400 hover:text-teal-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-grow py-4 px-4 space-y-1.5 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsSidebarOpen(false)}
            style={{ textDecoration: 'none' }}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              isActive('/')
                ? 'bg-teal-50 text-teal-800'
                : 'text-gray-600 hover:text-teal-700 hover:bg-gray-50'
            }`}
          >
            <Home className="w-5 h-5 shrink-0" />
            <span>Home</span>
          </Link>

          <Link
            to="/products"
            onClick={() => setIsSidebarOpen(false)}
            style={{ textDecoration: 'none' }}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              isActive('/products')
                ? 'bg-teal-50 text-teal-800'
                : 'text-gray-600 hover:text-teal-700 hover:bg-gray-50'
            }`}
          >
            <Pill className="w-5 h-5 shrink-0" />
            <span>Medicines</span>
          </Link>

          <Link
            to="/cart"
            onClick={() => setIsSidebarOpen(false)}
            style={{ textDecoration: 'none' }}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              isActive('/cart')
                ? 'bg-teal-50 text-teal-800'
                : 'text-gray-600 hover:text-teal-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <ShoppingCart className="w-5 h-5 shrink-0" />
              <span>Cart</span>
            </div>
            {itemCount > 0 && (
              <span className="bg-teal-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                {itemCount}
              </span>
            )}
          </Link>

          <Link
            to="/my-orders"
            onClick={() => setIsSidebarOpen(false)}
            style={{ textDecoration: 'none' }}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              isActive('/my-orders')
                ? 'bg-teal-50 text-teal-800'
                : 'text-gray-600 hover:text-teal-700 hover:bg-gray-50'
            }`}
          >
            <ClipboardList className="w-5 h-5 shrink-0" />
            <span>My Orders</span>
          </Link>

          <Link
            to="/profile"
            onClick={() => setIsSidebarOpen(false)}
            style={{ textDecoration: 'none' }}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              isActive('/profile')
                ? 'bg-teal-50 text-teal-800'
                : 'text-gray-600 hover:text-teal-700 hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5 shrink-0" />
            <span>Profile</span>
          </Link>

          <Link
            to="/my-orders"
            onClick={() => setIsSidebarOpen(false)}
            style={{ textDecoration: 'none' }}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
              isActive('/notifications')
                ? 'bg-teal-50 text-teal-800'
                : 'text-gray-600 hover:text-teal-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Bell className="w-5 h-5 shrink-0" />
              <span>Notifications</span>
            </div>
            {unreadNotifications > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                {unreadNotifications}
              </span>
            )}
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-150 shrink-0">
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              logoutUser();
            }}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-xl border border-gray-250 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}
