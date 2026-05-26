import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import {
  Landmark, Home, Pill, ShoppingCart, ClipboardList,
  User, LogOut, Bell
} from 'lucide-react';
import NotificationBell from '../shared/NotificationBell';

const NAV_LINKS = [
  { to: '/',                 label: 'Home',     Icon: Home },
  { to: '/products',         label: 'Medicines', Icon: Pill },
  { to: '/cart',             label: 'Cart',      Icon: ShoppingCart, showBadge: true },
  { to: '/my-orders',        label: 'Orders',    Icon: ClipboardList },
  { to: '/profile',          label: 'Profile',   Icon: User },
];

export default function CustomerLayout() {
  const { user, logoutUser } = useAuthStore();
  const itemCount = useCartStore(s =>
    (s.items || []).reduce((sum, i) => sum + i.quantity, 0)
  );
  const location = useLocation();

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

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
          <Link
            to="/"
            style={{ textDecoration: 'none' }}
            className="flex items-center gap-2 text-teal-700 font-extrabold text-base"
          >
            <Landmark className="w-5 h-5" />
            Pankaj Medical
          </Link>
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

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main className="flex-grow pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* ── Mobile bottom navigation bar ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch">
          {NAV_LINKS.map(({ to, label, Icon, showBadge }) => (
            <Link
              key={to}
              to={to}
              style={{ textDecoration: 'none' }}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive(to)
                  ? 'text-teal-700 bg-teal-50/60'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-teal-600 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isActive(to) ? 'text-teal-700' : ''}`}>
                {label}
              </span>
              {isActive(to) && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-teal-600" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
