import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user, role, isLoggingOut, authStatus } = useAuth();
  const location = useLocation();

  if (isLoggingOut || authStatus === 'LOGGING_OUT') {
    return <Outlet />;
  }

  if (!role || !allowedRoles.includes(role)) {
    // Redirect user to their own role's dashboard if attempting to access another role's route
    switch (role) {
      case 'ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      case 'FACULTY':
        return <Navigate to="/faculty/dashboard" replace />;
      case 'STUDENT':
        return <Navigate to="/student/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Force password change for initial password accounts before accessing normal workspace
  if (user?.mustChangePassword) {
    if (role === 'STUDENT' && location.pathname !== '/student/change-password') {
      return <Navigate to="/student/change-password" replace />;
    }
    if (role === 'FACULTY' && location.pathname !== '/faculty/profile') {
      return <Navigate to="/faculty/profile" replace />;
    }
  }

  return <Outlet />;
};
