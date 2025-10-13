import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, API_HOST } from '../config/networkConfig';

// Network configuration is now managed centrally!
// To change IP address, only update the root .env file
export { API_HOST };

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  // Generation can take a while; give it more time
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // Trigger logout in app
    }
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password, role) => 
    api.post('/auth/register', { name, email, password, role }),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  guestAccess: () => api.post('/auth/guest-access'),
};

// Quiz API
export const quizAPI = {
  uploadAndGenerate: (formData) => 
    api.post('/quiz/upload-and-generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  generateFromText: (data) => api.post('/quiz/generate-from-text', data),
  getAll: (params) => api.get('/quiz', { params }),
  getById: (id) => api.get(`/quiz/${id}`),
  submit: (id, answers, timeTaken) => 
    api.post(`/quiz/${id}/submit`, { answers, timeTaken }),
  update: (id, data) => api.put(`/quiz/${id}`, data),
  delete: (id) => api.delete(`/quiz/${id}`),
  getMyQuizzes: () => api.get('/quiz/my/quizzes'),
};

// Search API
export const searchAPI = {
  similarQuizzes: (query, limit = 10) => 
    api.get('/search/similar', { params: { query, limit } }),
  similarToQuiz: (quizId) => api.get(`/search/quiz/${quizId}/similar`),
  getCategories: () => api.get('/search/categories'),
  getTags: () => api.get('/search/tags'),
};

// Analytics API
export const analyticsAPI = {
  getMyStats: () => api.get('/analytics/my-stats'),
  getQuizAnalytics: (quizId) => api.get(`/analytics/quiz/${quizId}/analytics`),
  getLeaderboard: (limit = 10) => 
    api.get('/analytics/leaderboard', { params: { limit } }),
  getMyHistory: (page = 1, limit = 10) => 
    api.get('/analytics/my-history', { params: { page, limit } }),
  getHistoryDetail: (historyId) => api.get(`/analytics/history/${historyId}`),
};

// User API
export const userAPI = {
  upgradeSubscription: (plan) => api.post('/users/upgrade-subscription', { plan }),
  getUsageStats: () => api.get('/users/usage-stats'),
  resetPassword: (currentPassword, newPassword) => 
    api.post('/users/reset-password', { currentPassword, newPassword }),
  getUserById: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  uploadAvatar: (formData) => api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Classes API
export const classesAPI = {
  create: (data) => api.post('/classes', data),
  join: (code) => api.post('/classes/join', { code }),
  assign: (classId, quizId) => api.post(`/classes/${classId}/assign`, { quizId }),
  mine: () => api.get('/classes/mine'),
  getById: (id) => api.get(`/classes/${id}`),
};

// Payments API
export const paymentsAPI = {
  create: (data) => api.post('/payments', data),
  mine: () => api.get('/payments/mine'),
};

// Admin Payments
export const adminPaymentsAPI = {
  list: () => api.get('/payments'),
};

// Subscriptions API
export const subscriptionsAPI = {
  mine: () => api.get('/subscriptions/mine'),
  change: (plan, billingCycle='monthly') => api.post('/subscriptions/change', { plan, billingCycle }),
};

// Feedback API
export const feedbackAPI = {
  create: (data) => api.post('/feedback', data),
  mine: () => api.get('/feedback/mine'),
};

// Notifications API
export const notificationsAPI = {
  mine: () => api.get('/notifications/mine'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getQuizzes: (params) => api.get('/admin/quizzes', { params }),
  updateQuizStatus: (quizId, status) => 
    api.put(`/admin/quizzes/${quizId}/status`, { status }),
  getAnalytics: () => api.get('/admin/analytics'),
};

export default api;
