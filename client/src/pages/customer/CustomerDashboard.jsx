import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  User, Mail, Phone, Pill, ShoppingCart,
  ClipboardList, UserCircle, Trash2, ShieldAlert
} from 'lucide-react';

const QUICK_ACTIONS = [
  {
    to: '/products',
    label: 'Browse Medicines',
    description: 'Search & order from our full catalogue',
    Icon: Pill,
    color: 'teal',
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    icon: 'text-primary-600',
    text: 'text-primary-800',
  },
  {
    to: '/my-orders',
    label: 'My Orders',
    description: 'Track and manage your order history',
    Icon: ClipboardList,
    color: 'indigo',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: 'text-indigo-600',
    text: 'text-indigo-800',
  },
  {
    to: '/cart',
    label: 'My Cart',
    description: 'Review items and proceed to checkout',
    Icon: ShoppingCart,
    color: 'sky',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: 'text-sky-600',
    text: 'text-sky-800',
  },
  {
    to: '/profile',
    label: 'My Profile',
    description: 'Manage addresses and account settings',
    Icon: UserCircle,
    color: 'violet',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: 'text-violet-600',
    text: 'text-violet-800',
  },
];

import api from '../../services/api';

export default function CustomerDashboard() {
  const { user, softDeleteUserAccount, isLoading } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      await softDeleteUserAccount();
    } catch {
      alert('Failed to process account deletion.');
    }
  };

  const resendVerification = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const res = await api.post('/api/auth/resend-verification');
      if (res.data && res.data.success) {
        alert(res.data.message || 'Verification email has been resent!');
      } else {
        alert(res.data.message || 'Failed to resend verification email.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">

      {user && !user.isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3 shadow-sm">
          <ShieldAlert className="text-amber-500 w-5 h-5 shrink-0" />
          <span className="text-amber-800 text-sm font-medium">
            Please verify your email address to place orders.
            <button
              onClick={resendVerification}
              disabled={isResending}
              className="ml-2 underline font-bold hover:text-amber-900 transition-colors"
            >
              {isResending ? 'Resending...' : 'Resend verification email'}
            </button>
          </span>
        </div>
      )}

      {/* ── Welcome card ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6 flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 shrink-0">
          <User className="w-7 h-7" />
        </div>
        <div className="flex-grow min-w-0">
          <h1 className="text-xl font-black text-gray-800 truncate">
            Welcome back, {user?.name?.split(' ')[0] || 'Customer'}!
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Your Pankaj Medical account is active.</p>
        </div>
      </div>

      {/* ── Account info ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2.5 text-gray-600">
          <Mail className="w-4 h-4 text-primary-600 shrink-0" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</div>
            <div className="font-semibold text-gray-800">{user?.email || 'N/A'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-gray-600">
          <Phone className="w-4 h-4 text-primary-600 shrink-0" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone</div>
            <div className="font-semibold text-gray-800">{user?.phone || 'Not configured'}</div>
          </div>
        </div>
      </div>

      {/* ── Quick action cards ────────────────────────────────────────── */}
      <h2 className="text-base font-black text-gray-700 mb-3 uppercase tracking-wider">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {QUICK_ACTIONS.map(({ to, label, description, Icon, bg, border, icon, text }) => (
          <Link
            key={to}
            to={to}
            style={{ textDecoration: 'none' }}
            className={`${bg} ${border} border rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-all hover:scale-[1.03] hover:shadow-md active:scale-[0.97]`}
          >
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${icon}`} />
            </div>
            <div>
              <div className={`text-sm font-black ${text}`}>{label}</div>
              <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{description}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Danger zone ──────────────────────────────────────────────── */}
      <div className="border border-red-200 rounded-2xl p-5 bg-red-50/40">
        <div className="flex items-start gap-3">
          <ShieldAlert className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-grow">
            <h3 className="text-sm font-black text-red-800 mb-1">Delete My Account</h3>
            <p className="text-xs text-red-700 leading-relaxed mb-3">
              Permanently anonymize your profile data. Your name, phone, and addresses will be erased
              and you will be signed out. This cannot be reversed.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg border border-red-300 text-red-700 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-gray-800">Confirm Account Deletion</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
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
                disabled={isLoading}
                className="btn-primary bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3"
              >
                {isLoading ? 'Processing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
