import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('buyer' | 'vendor' | 'vendor_admin' | 'admin' | 'platform_admin' | 'super_admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login profile page
    // We can pass state to redirect back after login
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized, send them to their respective home
    if (['admin', 'platform_admin', 'super_admin'].includes(user.role)) {
      return <Navigate to="/admin" replace />;
    }
    if (['vendor', 'vendor_admin'].includes(user.role)) {
      return <Navigate to="/vendor" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
