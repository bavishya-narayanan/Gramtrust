import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiClient } from '@/lib/api-client';

export type UserRole = 'ADMIN' | 'OFFICIAL' | 'CITIZEN' | 'AUDITOR';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'gramtrust_token';

function decodeToken(token: string): AuthUser | null {
  try {
    const payload = jwtDecode<{ sub: string; name: string; email: string; role: UserRole }>(token);
    return { id: payload.sub, name: payload.name, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    return saved ? decodeToken(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: { token: string; user: AuthUser } }>(
        '/auth/login',
        { email, password },
      );
      const { token: newToken, user: newUser } = res.data.data;
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Attach / detach token to axios on change
  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
