import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import {
  Landmark, Home, Pill, ShoppingCart, ClipboardList,
  User, LogOut, Bell, Menu, X, LogIn
} from 'lucide-react';
import NotificationBell from '../shared/NotificationBell';
import SearchBar from '../shared/SearchBar';
import api from '../../services/api';

export default function CustomerLayout() {
  const { user, logoutUser, isAuthenticated } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  const itemCount = useCartStore(s =>
    (s.items || []).reduce((sum, i) => sum + i.quantity, 0)
  );
  const fetchCart = useCartStore(s => s.fetchCart);
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
    fetchCart(isAuthenticated);
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">

      {/* ── Unified top navbar (All screen sizes) ────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Left Side: Hamburger Icon & Brand Brand Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-gray-500 hover:text-teal-650 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link
              to="/"
              style={{ textDecoration: 'none' }}
              className="flex items-center gap-1.5 text-teal-700 font-extrabold text-base"
            >
              <Landmark className="w-5 h-5" />
              <span className="hidden xs:inline">Pankaj Medical</span>
            </Link>
          </div>

          {/* Middle: Autocomplete SearchBar wired into the Navbar */}
          <div className="flex-grow max-w-sm sm:max-w-xs md:max-w-md mx-2">
            <SearchBar />
          </div>

          {/* Right Side: Cart, Notifications dropdown, Account profile or Login */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link
              to="/cart"
              style={{ textDecoration: 'none' }}
              className="relative p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-full transition-colors shrink-0"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-teal-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                <NotificationBell />
                <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 font-semibold px-3 py-1.5 bg-gray-100 rounded-lg max-w-[130px] truncate">
                  <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">{user?.name?.split(' ')[0] || 'Account'}</span>
                </div>
                <button
                  onClick={() => logoutUser()}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{ textDecoration: 'none' }}
                className="btn-teal flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Slide-in sidebar navigation (All screen sizes) ────────────────── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 animate-fadeIn"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 bottom-0 left-0 w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
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

          {isAuthenticated && (
            <>
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
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-150 shrink-0">
          {isAuthenticated ? (
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                logoutUser();
              }}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-xl border border-gray-250 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsSidebarOpen(false)}
              style={{ textDecoration: 'none' }}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-xl border border-teal-500 text-teal-700 bg-teal-50/10 hover:bg-teal-50 hover:text-teal-800 transition-colors text-center"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          )}
        </div>
      </div>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-200 py-10 px-4 md:px-6 shrink-0">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left text-sm text-gray-500">
          <div>
            <h4 className="font-extrabold text-teal-800 text-base mb-3">
              PANKAJ MEDICAL & GENERAL STORES
            </h4>
            <p className="leading-relaxed max-w-sm">
              Your neighborhood digital pharmacy. Providing batch-verified genuine medicines and
              supplements inside Kanpur.
            </p>
          </div>
          <div className="space-y-2 md:text-right">
            <h4 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-1">
              Corporate Registration
            </h4>
            <p>
              <strong>GSTIN:</strong> 09ACPPL2448G1ZB
            </p>
            <p>
              <strong>Registered Address:</strong> 133/17 M Block, Kidwainagar, Kanpur Nagar, UP
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-gray-100 mt-8 pt-6 text-center text-xs text-gray-400">
          <p>
            © {new Date().getFullYear()} Pankaj Medical and General Stores. All Rights Reserved.
            Compliant with UP Drugs Department.
          </p>
        </div>
      </footer>
    </div>
  );
}
