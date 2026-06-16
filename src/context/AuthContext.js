'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isVip, setIsVip] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load auth data on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('jlpt_auth_token');
        const storedUser = localStorage.getItem('jlpt_auth_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Check VIP status
          await checkSubscription(storedToken);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Check user subscription status
  const checkSubscription = async (authToken = token) => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/membership/status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setIsVip(data.isVip);
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    }
  };

  // Login action
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('jlpt_auth_token', data.token);
      localStorage.setItem('jlpt_auth_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);

      // Fetch subscription status
      await checkSubscription(data.token);
      
      return data;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  // Register action
  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Automatically login after successful signup
      return await login(email, password);
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  // Logout action
  const logout = () => {
    localStorage.removeItem('jlpt_auth_token');
    localStorage.removeItem('jlpt_auth_user');
    
    setToken(null);
    setUser(null);
    setIsVip(false);
    setSubscription(null);
  };

  // Update user data locally
  const updateUserData = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('jlpt_auth_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isVip,
        subscription,
        loading,
        login,
        register,
        logout,
        checkSubscription,
        updateUserData
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
