import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * Route protection wrapper implementing specific role redirect policies
 */
const ProtectedRoute = ({ roles }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-gray-500">
            Checking your authorization...
          </span>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated users go to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Authenticated users going to routes that DO NOT match their role
  if (roles && !roles.includes(user.role)) {
    console.log(
      `Unauthorized role ${user.role} attempting to access ${roles.join(',')}. Redirecting...`
    );

    // Redirect matrix to user's OWN dashboard shell
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'staff') {
      return <Navigate to="/staff/dashboard" replace />;
    } else {
      return <Navigate to="/customer/dashboard" replace />;
    }
  }

  // 3. Authorized and role-matched: render child routes
  return <Outlet />;
};

export default ProtectedRoute;
