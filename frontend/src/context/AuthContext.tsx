import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getErrorMessage } from '@/services/api';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  isVerifier: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { full_name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('chainproof_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('chainproof_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const profile = await api.auth.getProfile();
          setUser(profile);
          localStorage.setItem('chainproof_user', JSON.stringify(profile));
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      localStorage.setItem('chainproof_token', res.access_token);
      setToken(res.access_token);

      // Fetch fresh profile
      const profile = await api.auth.getProfile();
      setUser(profile);
      localStorage.setItem('chainproof_user', JSON.stringify(profile));
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { full_name: string; email: string; password: string; role: UserRole }) => {
    setIsLoading(true);
    try {
      await api.auth.register(data);
      // Auto login after registration
      await login(data.email, data.password);
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('chainproof_token');
    localStorage.removeItem('chainproof_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (token) {
      try {
        const profile = await api.auth.getProfile();
        setUser(profile);
        localStorage.setItem('chainproof_user', JSON.stringify(profile));
      } catch (err) {
        console.error('Failed to refresh profile:', err);
      }
    }
  };

  const isCreator = user?.role === 'CREATOR';
  const isAdmin = user?.role === 'ADMINISTRATOR';
  const isVerifier = user?.role === 'VERIFIER';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        isCreator,
        isAdmin,
        isVerifier,
        login,
        register,
        logout,
        refreshProfile,
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
