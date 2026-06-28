import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchMe,
  logoutApi,
  type AuthUser,
} from '../services/authService';
import { clearTokens } from '../services/api';

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

type UserRole = 'student' | 'professor' | 'admin' | null;

interface AuthContextType {
  userRole: UserRole;
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (role: UserRole, user?: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (role: UserRole, authUser?: AuthUser) => {
    setUserRole(role);
    if (authUser) setUser(authUser);
    localStorage.setItem('userRole', role || '');
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = useCallback(async () => {
    await logoutApi();
    setUserRole(null);
    setUser(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('isAuthenticated');
    clearTokens();
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
    setUserRole(me.role as UserRole);
    localStorage.setItem('userRole', me.role);
    localStorage.setItem('isAuthenticated', 'true');
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = getAccessToken();
      const savedRole = localStorage.getItem('userRole') as UserRole;
      if (token) {
        try {
          const me = await fetchMe();
          setUser(me);
          setUserRole(me.role as UserRole);
        } catch {
          clearTokens();
          if (savedRole) setUserRole(savedRole);
        }
      } else if (localStorage.getItem('isAuthenticated') === 'true' && savedRole) {
        setUserRole(savedRole);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const isAuthenticated = userRole !== null && !!getAccessToken();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ userRole, isAuthenticated, user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
