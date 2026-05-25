import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { LogOut, Landmark, Settings, Users, Database } from 'lucide-react';

const AdminDashboard = () => {
  const { user, logoutUser } = useAuthStore();

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top Navbar */}
      <nav className="bg-slate-900 text-white shadow-sm py-4 px-6 md:px-8 flex justify-between items-center">
        <h1 className="text-xl font-bold font-sans flex items-center gap-2">
          <Landmark className="text-teal-500 w-5 h-5" /> Pankaj Medical Stores
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-red-600 px-2.5 py-1 rounded-full font-semibold uppercase">
            Administrator
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-1.5 px-3 rounded border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4">
        {/* Welcome Box */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xs mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Welcome, Admin {user?.name || 'Administrator'}!
              </h2>
              <p className="text-sm text-gray-500">Root System Control Shell</p>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-100 pt-4 flex gap-4 text-xs text-gray-500 font-mono">
            <span>ADMIN_EMAIL MATCH: {user?.email || 'N/A'}</span>
          </div>
        </div>

        {/* Admin Scopes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Staff Management</h3>
              <p className="text-xs text-gray-500 leading-normal">
                Invite new pharmacy staff, activate/deactivate accounts, and configure permissions.
              </p>
            </div>
            <button
              className="btn-teal text-xs py-1.5 mt-6 w-full opacity-60 cursor-not-allowed"
              disabled
            >
              Manage Staff (Phase 5)
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Bulk Data Import</h3>
              <p className="text-xs text-gray-500 leading-normal">
                Perform batch updates on prices, stocks, and expiration batches via CSV files.
              </p>
            </div>
            <button
              className="btn-teal text-xs py-1.5 mt-6 w-full opacity-60 cursor-not-allowed"
              disabled
            >
              Import CSV (Phase 2)
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded flex items-center justify-center mb-4">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Store Controls</h3>
              <p className="text-xs text-gray-500 leading-normal">
                Configure delivery charges, modify whitelisted pin codes, and trigger maintenance
                modes.
              </p>
            </div>
            <button
              className="btn-teal text-xs py-1.5 mt-6 w-full opacity-60 cursor-not-allowed"
              disabled
            >
              Settings (Phase 5)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
