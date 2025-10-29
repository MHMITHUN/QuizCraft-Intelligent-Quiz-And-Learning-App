import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const guestTrialTimerRef = useRef(null);
  const guestTrialIntervalRef = useRef(null);
  const [guestTrialRemaining, setGuestTrialRemaining] = useState(null);

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
      if (err?.message) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('[AuthContext] Login started for:', email);
      setLoading(true);
      setError(null);
      
      const response = await authAPI.login(email, password);
      console.log('[AuthContext] Login response:', JSON.stringify(response.data, null, 2));
      
      // Check if admin 2FA is required
      if (response.data.requiresAdminVerification) {
        console.log('[AuthContext] Admin 2FA detected');
        setLoading(false);
        return { 
          success: true, 
          requiresAdminVerification: true,
          email: response.data.data.email,
          codeExpiresAt: response.data.data.codeExpiresAt,
          message: response.data.message
        };
      }
      
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

  const verifyAdminLogin = async (email, code) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.verifyAdminLogin(email, code);
      
      const { user, token } = response.data.data;
      if (token) {
        await AsyncStorage.setItem('token', String(token));
      }
      setUser(user);
      
      return { success: true };
    } catch (err) {
      const errorMsg = err.message || 'Verification failed';
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

  const logout = useCallback(async (message) => {
    try {
      await AsyncStorage.removeItem('token');
      setUser(null);
      setGuestTrialRemaining(null);
      setError(message || null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

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

  useEffect(() => {
    const clearExistingTimers = () => {
      if (guestTrialTimerRef.current) {
        clearTimeout(guestTrialTimerRef.current);
        guestTrialTimerRef.current = null;
      }
      if (guestTrialIntervalRef.current) {
        clearInterval(guestTrialIntervalRef.current);
        guestTrialIntervalRef.current = null;
      }
      setGuestTrialRemaining(null);
    };

    const scheduleGuestExpiry = () => {
      if (user?.role !== 'guest' || !user?.guestTrialExpiresAt) {
        setGuestTrialRemaining(null);
        return;
      }

      const expiresAt = new Date(user.guestTrialExpiresAt).getTime();
      if (!Number.isFinite(expiresAt)) {
        setGuestTrialRemaining(null);
        return;
      }

      const finishSession = () => {
        clearExistingTimers();
        logout('Your guest trial has ended. Please create an account to continue.')
          .catch((err) => console.error('Guest trial logout error:', err));
      };

      const tick = () => {
        const remaining = expiresAt - Date.now();
        if (remaining <= 0) {
          finishSession();
        } else {
          setGuestTrialRemaining(remaining);
        }
      };

      tick();

      guestTrialIntervalRef.current = setInterval(tick, 1000);

      const totalMs = expiresAt - Date.now();
      if (totalMs > 0) {
        guestTrialTimerRef.current = setTimeout(finishSession, totalMs);
      } else {
        finishSession();
      }
    };

    clearExistingTimers();
    scheduleGuestExpiry();

    return () => {
      clearExistingTimers();
    };
  }, [user, logout]);

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
    guestTrialRemaining,
    verifyAdminLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
