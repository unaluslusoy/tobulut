
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ModuleType } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredModule?: ModuleType;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requiredModule }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1. Role Check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 2. Module Access Check
  if (requiredModule && user) {
    // If allowedModules is defined and not empty, check strict access
    // If empty or undefined, we assume FULL ACCESS (like SuperAdmin or Legacy User)
    if (user.allowedModules && user.allowedModules.length > 0) {
        if (!user.allowedModules.includes(requiredModule)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
