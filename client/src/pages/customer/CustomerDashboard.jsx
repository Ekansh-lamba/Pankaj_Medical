import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User, Mail, ShieldAlert, Phone, Trash2 } from 'lucide-react';

const CustomerDashboard = () => {
  const { user, logoutUser, softDeleteUserAccount, isLoading } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
  };

  const handleDeleteAccount = async () => {
    try {
      await softDeleteUserAccount();
      alert('Your account has been deleted and anonymized successfully.');
    } catch (err) {
      alert('Failed to process account deletion.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top Navbar */}
      <nav className="bg-teal-600 text-white shadow-sm py-4 px-6 md:px-8 flex justify-between items-center">
        <h1 className="text-xl font-bold font-sans">Pankaj Medical Stores</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-teal-700 px-2.5 py-1 rounded-full font-semibold uppercase">
            Customer Portal
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold py-1.5 px-3 rounded border border-teal-500 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4">
        {/* Welcome Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xs mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Welcome, {user?.name || 'Customer'}!
              </h2>
              <p className="text-sm text-gray-500">Registered Customer Dashboard Shell</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-600" />
              <span>
                Email: <strong className="text-gray-800">{user?.email || 'N/A'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-600" />
              <span>
                Phone: <strong className="text-gray-800">{user?.phone || 'Not configured'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Phase 1 Feature Box */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Phase 1 Delivery Completed</h3>
            <p className="text-sm text-gray-500">
              All authentication, JWT, and foundation operations are functional.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="border border-teal-100 bg-teal-50/50 p-4 rounded-lg">
              <h4 className="font-bold text-teal-900 mb-1">Custom JWT Authentication</h4>
              <p className="text-xs text-gray-600 leading-normal">
                Access tokens expire in 15 minutes. Secure httpOnly refresh token cookie
                automatically keeps you logged in.
              </p>
            </div>

            <div className="border border-teal-100 bg-teal-50/50 p-4 rounded-lg">
              <h4 className="font-bold text-teal-900 mb-1">Role Security Guard</h4>
              <p className="text-xs text-gray-600 leading-normal">
                Prevents access to Staff or Admin dashboards. Attempts auto-redirect you back to
                this screen.
              </p>
            </div>
          </div>

          {/* Destructive soft delete showcase */}
          <div className="border border-red-200 rounded-lg p-6 bg-red-50/30">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-red-600 w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-900 mb-1">Soft Delete and Anonymize Profile</h4>
                <p className="text-xs text-red-800 leading-relaxed mb-4">
                  Test the GDPR/PII anonymization rule right now. Deleting your account will mark
                  `isDeleted: true` in MongoDB, erase your name, phone, and addresses, generate a
                  random mock email address, and immediately log you out.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn-white text-red-700 border-red-300 hover:bg-red-50 hover:text-red-800 flex items-center gap-1.5 py-2 px-3 text-xs"
                >
                  <Trash2 className="w-4 h-4" /> Soft-Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Confirm Account Deletion</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Are you sure you want to proceed? Your email, phone, name, and address data will be
              anonymized. This action is permanent and cannot be reversed.
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
                disabled={isLoading}
                className="btn-teal bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3"
              >
                {isLoading ? 'Processing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
