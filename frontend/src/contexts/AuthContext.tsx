import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserResponse } from '@/types/api';
import { auth } from '@/api/client';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (name: string, password: string) => Promise<void>;
  register: (name: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount via the /auth/me endpoint.
  // The backend reads the httponly cookie and returns the current user.
  useEffect(() => {
    auth.me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (name: string, password: string) => {
    const u = await auth.login({ name, password });
    setUser(u);
  }, []);

  const register = useCallback(async (name: string, password: string, email?: string) => {
    await auth.register({ name, email, password });
    const u = await auth.login({ name, password });
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await auth.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
