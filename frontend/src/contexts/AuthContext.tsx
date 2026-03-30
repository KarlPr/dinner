import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserResponse } from '@/types/api';
import { auth, users } from '@/api/client';

const USER_STORAGE_KEY = 'dinner_user';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (name: string, password: string) => Promise<void>;
  register: (name: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadStoredUser(): UserResponse | null {
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeUser(user: UserResponse | null) {
  if (user) {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount by hitting an authenticated endpoint.
  // If the cookie is valid, the request succeeds and we trust the stored user.
  // If not, clear stored state.
  useEffect(() => {
    const stored = loadStoredUser();
    if (!stored) {
      setLoading(false);
      return;
    }

    // Validate the session is still alive by fetching the user's own profile
    users.get(stored.id)
      .then((u) => {
        setUser(u);
        storeUser(u);
      })
      .catch(() => {
        storeUser(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (name: string, password: string) => {
    const u = await auth.login({ name, password });
    setUser(u);
    storeUser(u);
  }, []);

  const register = useCallback(async (name: string, password: string, email?: string) => {
    await auth.register({ name, email, password });
    // Auto-login after registration
    const u = await auth.login({ name, password });
    setUser(u);
    storeUser(u);
  }, []);

  const logout = useCallback(async () => {
    await auth.logout();
    setUser(null);
    storeUser(null);
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
