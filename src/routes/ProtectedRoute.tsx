import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, isLoggingOut, authStatus } = useAuth();

  if (isLoading || authStatus === 'INITIALIZING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner label="Verifying session credentials..." size="lg" />
      </div>
    );
  }

  if (isLoggingOut || authStatus === 'LOGGING_OUT') {
    return <Outlet />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
