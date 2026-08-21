import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient, { setAccessToken } from '../api/apiClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Attempt to refresh the access token on startup
  const refreshAccessToken = async () => {
    try {
      const res = await apiClient.post('/auth/refresh');
      const { accessToken } = res.data;
      setAccessToken(accessToken);
      
      // Fetch user profile info
      const meRes = await apiClient.get('/auth/me');
      setUser(meRes.data.user);
      setIsAuthenticated(true);
    } catch (err) {
      console.log('No active authenticated session detected on startup.');
      setAccessToken('');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAccessToken();

    // Listen to custom 'auth:unauthorized' events fired by the Axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { accessToken, user: userData } = res.data;
      
      setAccessToken(accessToken);
      setUser(userData);
      setIsAuthenticated(true);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      // Auto login on successful registration
      await login(email, password);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error response:', err);
    } finally {
      setAccessToken('');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout }}>
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
export default AuthContext;
