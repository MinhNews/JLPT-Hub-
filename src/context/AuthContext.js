'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

// Helper: fetch with credentials (sends HttpOnly cookie automatically)
const apiFetch = (path, options = {}) =>
  fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isVip, setIsVip] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore user from localStorage (non-sensitive display data only)
  // Token is in HttpOnly cookie — browser sends it automatically
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('jlpt_auth_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          await checkSubscription();
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Check subscription — cookie sent automatically
  const checkSubscription = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await apiFetch('/membership/status', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('jlpt_auth_user');
        setUser(null);
        setIsVip(false);
        setSubscription(null);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setIsVip(data.isVip);
        setSubscription(data.subscription);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to check subscription:', err);
      }
    }
  };

  // Login — server sets HttpOnly cookie, we only store non-sensitive user info
  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem('jlpt_auth_user', JSON.stringify(data.user));
    setUser(data.user);
    await checkSubscription();
    return data;
  };

  // Register then auto-login
  const register = async (name, email, password) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    return await login(email, password);
  };

  // Google Login — server sets HttpOnly cookie
  const googleLoginAuth = async (credential) => {
    const res = await apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Google Login failed');

    localStorage.setItem('jlpt_auth_user', JSON.stringify(data.user));
    setUser(data.user);
    await checkSubscription();
    return data;
  };

  // Logout — tell server to clear cookie, then clear local state
  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('jlpt_auth_user');
      setUser(null);
      setIsVip(false);
      setSubscription(null);
    }
  };

  const updateUserData = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('jlpt_auth_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isVip,
        subscription,
        loading,
        login,
        register,
        googleLoginAuth,
        logout,
        checkSubscription,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
