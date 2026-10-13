import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on initial mount
    const savedToken = localStorage.getItem('placement_token');
    const savedUser = localStorage.getItem('placement_user');

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);

        // Verify token with backend; auto-heal if token expired
        apiClient.get('/auth/me').catch(async (err) => {
          if (err.response?.status === 401 || err.response?.status === 403) {
            try {
              const res = await apiClient.post('/auth/switch-role', {
                targetRole: parsed.roleName || 'SUPER_ADMIN',
              });
              if (res.data?.token) {
                localStorage.setItem('placement_token', res.data.token);
                localStorage.setItem('placement_user', JSON.stringify(res.data.user));
                setUser(res.data.user);
              }
            } catch (e) {
              localStorage.removeItem('placement_token');
              localStorage.removeItem('placement_user');
              setUser(null);
            }
          }
        });
      } catch (e) {
        localStorage.removeItem('placement_user');
        localStorage.removeItem('placement_token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    // Small timeout for smooth initial load transition
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      const res = await apiClient.post('/auth/login', {
        email: emailOrUsername,
        password,
      });
      const { token, user: userData } = res.data;
      localStorage.setItem('placement_token', token);
      localStorage.setItem('placement_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please verify credentials.',
      };
    }
  };

  const switchRole = async (targetRole) => {
    try {
      const res = await apiClient.post('/auth/switch-role', { targetRole });
      const { token, user: userData } = res.data;
      localStorage.setItem('placement_token', token);
      localStorage.setItem('placement_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to switch portal.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('placement_token');
    localStorage.removeItem('placement_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, switchRole, logout }}>
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
