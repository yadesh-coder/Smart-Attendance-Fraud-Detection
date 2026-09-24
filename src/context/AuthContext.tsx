import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService, LoginCredentials } from '../services/authService';

export type AuthStatus = 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'LOGGING_OUT';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  authStatus: AuthStatus;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: (navigateFn?: (path: string, options?: { replace?: boolean }) => void) => void;
  clearError: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for saved session
    const savedUser = localStorage.getItem('smart_attendance_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem('smart_attendance_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      localStorage.setItem('smart_attendance_user', JSON.stringify(response.user));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials or login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('smart_attendance_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = (navigateFn?: (path: string, options?: { replace?: boolean }) => void) => {
    // 1. Mark as logging out so ProtectedRoute does not redirect to /login
    setIsLoggingOut(true);

    // 2. Call backend logout asynchronously without blocking local transition
    authService.logout().catch(() => {});

    // 3. Smooth transition to landing page directly with replace: true
    if (navigateFn) {
      navigateFn('/', { replace: true });
    } else {
      window.location.href = '/';
    }

    // 4. Clear local user and session state after navigation has initiated
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem('smart_attendance_user');
      setIsLoggingOut(false);
    }, 850);
  };

  const clearError = () => setError(null);

  const authStatus: AuthStatus = isLoading
    ? 'INITIALIZING'
    : isLoggingOut
    ? 'LOGGING_OUT'
    : user
    ? 'AUTHENTICATED'
    : 'UNAUTHENTICATED';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        isLoading,
        isLoggingOut,
        authStatus,
        error,
        login,
        logout,
        clearError,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
