import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../../../api/apiservice';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyResponse = useCallback((response) => {
    const payload = response?.data;
    if (!payload?.user || !payload?.authorization) {
      throw new Error('The authentication response is invalid.');
    }
    setSession(payload);
    return payload;
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      return applyResponse(await authApi.me());
    } catch (error) {
      setSession(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    fetchUser().catch(() => undefined);
  }, [fetchUser]);

  useEffect(() => {
    const unauthorized = () => setSession(null);
    window.addEventListener('api:unauthorized', unauthorized);
    return () => window.removeEventListener('api:unauthorized', unauthorized);
  }, []);

  const login = useCallback(async (email, password, remember) => {
    const response = await authApi.login(email, password, remember);
    applyResponse(response);
    return response;
  }, [applyResponse]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setSession(null);
    }
  }, []);

  const permissionSet = useMemo(
    () => new Set(session?.authorization?.permissions ?? []),
    [session],
  );

  const hasPermission = useCallback(
    (permission) => Boolean(session?.user?.is_super_admin) || !permission || permissionSet.has(permission),
    [permissionSet, session],
  );

  const value = useMemo(() => ({
    user: session?.user ?? null,
    authorization: session?.authorization ?? null,
    permissions: permissionSet,
    hasPermission,
    isAuthenticated: Boolean(session?.user),
    loading,
    login,
    logout,
    checkAuth: fetchUser,
  }), [fetchUser, hasPermission, loading, login, logout, permissionSet, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
