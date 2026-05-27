import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Landmark,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Clock,
  Package,
  Menu,
  X,
} from 'lucide-react';

// Staff sidebar nav items
const NAV_ITEMS = [
  { label: 'Dashboard',     path: '/staff/dashboard',       icon: LayoutDashboard, live: true  },
  { label: 'Expiry',        path: '/staff/expiry',          icon: Clock,           live: true  },
  { label: 'Orders',        path: '/staff/orders',          icon: ShoppingCart,    live: true, phase: 3 },
  { label: 'Prescriptions', path: '/staff/prescriptions',   icon: FileText,        live: true, phase: 3 },
  { label: 'Inventory',     path: '/staff/inventory',       icon: Package,         live: false, phase: 3 },
];

const StaffLayout = ({ children }) => {
  const { user, logoutUser } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">Pankaj Medical</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">Staff Portal</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          if (!item.live) {
            return (
              <div
                key={item.path}
                title={`Coming in Phase ${item.phase}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-slate-500 cursor-not-allowed select-none"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-[9px] font-bold bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-wide">
                  Ph {item.phase}
                </span>
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-slate-700/60">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            S
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name || 'Staff Member'}</p>
            <p className="text-slate-400 text-[10px] truncate">{user?.email || 'staff'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-[#1e3a5f] shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 flex flex-col w-64 bg-[#1e3a5f] h-full">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#1e3a5f] text-white shrink-0">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-white" />
            <span className="font-bold text-sm">Pankaj Medical</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
