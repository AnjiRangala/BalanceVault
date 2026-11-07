import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api.js';

const STORAGE_KEY = 'balancevault.session.v1';
const AuthContext = createContext(null);

function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (!value?.accessToken || !value?.user?.id || !value?.user?.email
      || !Number.isFinite(value?.expiresAt) || value.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return value;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const acceptAuthentication = useCallback((result) => {
    if (!result?.accessToken || !result?.user?.id || !result?.user?.email) {
      throw new Error('The server returned an invalid authentication response.');
    }
    const nextSession = {
      accessToken: result.accessToken,
      user: result.user,
      expiresAt: Date.now() + (Number(result.expiresIn) || 900) * 1000,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    return result.user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const result = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password },
    });
    return acceptAuthentication(result);
  }, [acceptAuthentication]);

  const register = useCallback(async ({ name, email, password }) => {
    const result = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: { name: name.trim(), email: email.trim().toLowerCase(), password },
    });
    return acceptAuthentication(result);
  }, [acceptAuthentication]);

  const request = useCallback((path, options = {}) => apiRequest(path, {
    ...options,
    token: session?.accessToken,
    onUnauthorized: logout,
  }), [logout, session?.accessToken]);

  const value = useMemo(() => ({
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isAuthenticated: Boolean(session?.accessToken),
    login,
    register,
    logout,
    request,
  }), [login, logout, register, request, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
