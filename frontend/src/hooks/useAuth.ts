import { useState, useEffect, useCallback } from 'react';
import { apiMe, apiLogout, type AuthUser } from '../services/auth';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return { user, loading, setUser, logout };
}
