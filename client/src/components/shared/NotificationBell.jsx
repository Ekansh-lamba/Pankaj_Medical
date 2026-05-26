import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, AlertTriangle, Info, Package, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const NOTIFICATION_ICONS = {
  order_placed: Package,
  order_confirmed: CheckCircle2,
  order_packed: Package,
  order_shipped: Package,
  order_delivered: CheckCircle2,
  order_cancelled: AlertTriangle,
  prescription_approved: CheckCircle2,
  prescription_rejected: AlertCircle,
  prescription_reupload: AlertTriangle,
  return_received: Info,
  refund_initiated: CheckCircle2,
  low_stock: AlertCircle,
  new_rx_order: AlertTriangle
};

const NOTIFICATION_COLORS = {
  order_placed: 'text-blue-500 bg-blue-50',
  order_confirmed: 'text-teal-600 bg-teal-50',
  order_packed: 'text-teal-600 bg-teal-50',
  order_shipped: 'text-teal-600 bg-teal-50',
  order_delivered: 'text-teal-600 bg-teal-50',
  order_cancelled: 'text-red-500 bg-red-50',
  prescription_approved: 'text-teal-600 bg-teal-50',
  prescription_rejected: 'text-red-500 bg-red-50',
  prescription_reupload: 'text-amber-500 bg-amber-50',
  return_received: 'text-blue-500 bg-blue-50',
  refund_initiated: 'text-teal-600 bg-teal-50',
  low_stock: 'text-red-500 bg-red-50',
  new_rx_order: 'text-amber-500 bg-amber-50'
};

export default function NotificationBell() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/api/notifications/unread-count');
      if (res.data && res.data.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch (err) {
      console.error('Fetch unread count failed:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/api/notifications?limit=10');
      if (res.data && res.data.success) {
        setNotifications(res.data.data.notifications);
      }
    } catch (err) {
      console.error('Fetch notifications failed:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchNotifications();

      // Poll unread counts every 60 seconds
      const timer = setInterval(() => {
        fetchUnreadCount();
        if (isOpen) {
          fetchNotifications();
        }
      }, 60000);

      return () => clearInterval(timer);
    }
  }, [isAuthenticated, isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id, link) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      fetchUnreadCount();
      setIsOpen(false);
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error('Mark as read failed:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse border border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-150 flex items-center justify-between">
            <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wider">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] text-teal-600 hover:text-teal-700 font-extrabold transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] || Info;
                const iconColor = NOTIFICATION_COLORS[notification.type] || 'text-gray-500 bg-gray-50';

                return (
                  <div
                    key={notification._id}
                    onClick={() => handleMarkAsRead(notification._id, notification.link)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-teal-50/10 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-teal-50/5' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold text-gray-800 leading-normal truncate ${
                          !notification.isRead ? 'font-extrabold' : ''
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="w-1.5 h-1.5 bg-teal-500 rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-normal mt-0.5 break-words">
                        {notification.message}
                      </p>
                      <span className="text-[9px] text-gray-400 font-semibold block mt-1">
                        {new Date(notification.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-xs text-gray-400 font-semibold">
                No notifications to display
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 text-center border-t border-gray-150">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/my-orders');
              }}
              className="text-[10px] font-bold text-teal-800 hover:text-teal-900 uppercase tracking-widest"
            >
              View All Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
