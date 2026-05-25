import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

import {
  Pill,
  FileUp,
  Clock,
  ShoppingCart,
  FileText,
  Users,
  ArrowRight,
} from 'lucide-react';

// Quick-action cards — live ones are Links, coming-soon ones are disabled divs
const QUICK_ACTIONS = [
  {
    label: 'Product Catalogue',
    desc: 'View, edit, hide, and manage all medicines in the inventory.',
    icon: Pill,
    path: '/admin/products',
    color: 'teal',
    live: true,
  },
  {
    label: 'Import CSV',
    desc: 'Batch-upload or update stock records from a spreadsheet file.',
    icon: FileUp,
    path: '/admin/products/import',
    color: 'teal',
    live: true,
  },
  {
    label: 'Expiry Monitor',
    desc: 'Review expired, near-expiry, and expiring-soon stock buckets.',
    icon: Clock,
    path: '/admin/expiry',
    color: 'amber',
    live: true,
  },
  {
    label: 'Orders',
    desc: 'Process, track, and dispatch customer orders.',
    icon: ShoppingCart,
    path: '/admin/orders',
    color: 'slate',
    live: false,
    phase: 3,
  },
  {
    label: 'Prescriptions',
    desc: 'Review and approve patient prescription uploads.',
    icon: FileText,
    path: '/admin/prescriptions',
    color: 'slate',
    live: false,
    phase: 3,
  },
  {
    label: 'Staff Management',
    desc: 'Invite staff, set permissions, and manage accounts.',
    icon: Users,
    path: '/admin/staff',
    color: 'slate',
    live: false,
    phase: 5,
  },
];

// Color map
const COLOR = {
  teal: {
    icon: 'bg-teal-50 text-teal-600',
    border: 'border-gray-200 hover:border-teal-300 hover:shadow-sm',
    arrow: 'text-teal-500',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    border: 'border-gray-200 hover:border-amber-300 hover:shadow-sm',
    arrow: 'text-amber-500',
  },
  slate: {
    icon: 'bg-gray-100 text-gray-400',
    border: 'border-gray-100',
    arrow: 'text-gray-300',
  },
};

const AdminDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || 'Administrator'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's a quick overview of what you can manage from this panel.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              const c = COLOR[action.color];

              if (!action.live) {
                return (
                  <div
                    key={action.path}
                    className={`bg-white border rounded-xl p-5 flex flex-col gap-3 opacity-50 cursor-not-allowed ${c.border}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.icon}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full uppercase">
                        Phase {action.phase}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-700">{action.label}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{action.desc}</p>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={action.path}
                  to={action.path}
                  style={{ textDecoration: 'none' }}
                  className={`group bg-white border rounded-xl p-5 flex flex-col gap-3 transition-all ${c.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.icon}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${c.arrow}`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">{action.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{action.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* System Info strip */}
        <div className="mt-10 bg-slate-900 rounded-xl px-6 py-4 flex flex-wrap gap-x-8 gap-y-2 text-xs font-mono text-slate-400">
          <span>ROLE: <span className="text-red-400 font-bold">ADMIN</span></span>
          <span>EMAIL: <span className="text-slate-200">{user?.email || 'N/A'}</span></span>
          <span>USER ID: <span className="text-slate-200">{user?.id || 'N/A'}</span></span>
        </div>
      </div>
  );
};

export default AdminDashboard;
