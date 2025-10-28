import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from storage on app start
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await authAPI.getProfile();
        setUser(response.data.data.user);
      }
    } catch (err) {
      console.error('Load user error:', err);
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.login(email, password);
      
      const { user, token } = response.data.data;
      if (token) {
        await AsyncStorage.setItem('token', String(token));
      } else {
        await AsyncStorage.removeItem('token');
      }
      setUser(user);
      
      return { success: true };
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role = 'student') => {
    try {
      console.log('[AuthContext] Starting register...');
      setError(null);
      // DON'T set loading here to avoid re-renders
      
      const response = await authAPI.register(name, email, password, role);
      console.log('[AuthContext] Register response received');
      
      if (!response || !response.data || !response.data.data) {
        throw new Error('Invalid response from server');
      }
      
      const { user, token } = response.data.data || {};
      console.log('[AuthContext] User email:', user?.email, 'Verified?', user?.isEmailVerified);
      
      // DON'T change any state here - just return the result
      // Navigation will handle the flow
      
      console.log('[AuthContext] Register complete, success!');
      return { success: true, needsVerification: !user?.isEmailVerified, user };
    } catch (err) {
      console.error('[AuthContext] Register error:', err);
      console.error('[AuthContext] Error details:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const guestAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.guestAccess();

      const { user, token } = response.data.data;
      await AsyncStorage.setItem('token', token);
      setUser(user);

      return { success: true };
    } catch (err) {
      const errorMsg = err.message || 'Guest access failed';
      setError(errorMsg);
      console.error('Guest access error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.data.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    guestAccess,
    updateProfile,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
