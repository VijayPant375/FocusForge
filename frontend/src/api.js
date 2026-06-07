import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 — clears stale token and redirects to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we're not already on an auth page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
  awardFreezeTokens: (amount) => api.post('/users/award-freeze', { amount }),
  useFreezeToken: () => api.post('/users/freeze'),
};

export const habitAPI = {
  create: (data) => api.post('/habits', data),
  getAll: () => api.get('/habits'),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  permanentDelete: (id) => api.delete(`/habits/${id}/permanent`),
  export: (format) => api.get(`/habits/export?format=${format}`, { responseType: 'blob' }),
  getArchived: () => api.get('/habits/archived'),
  restore: (id) => api.patch(`/habits/${id}/restore`),
  complete: (id, data = {}) => api.post(`/habits/${id}/complete`, data),
  // 2.1 Chains
  setChain: (id, chainToId) => api.post(`/habits/${id}/chain`, { chainToId }),
  removeChain: (id) => api.delete(`/habits/${id}/chain`),
  // 2.4 Reminders
  setReminder: (id, data) => api.put(`/habits/${id}/reminder`, data),
  // Offline
  syncOffline: (completions) => api.post('/habits/sync-offline', completions),
};

export const analyticsAPI = {
  getStats: () => api.get('/analytics/stats'),
  getWeekly: () => api.get('/analytics/weekly'),
  getWeeklyReview: () => api.get('/analytics/weekly-review'),
};

export const aiAPI = {
  getInsights: () => api.get('/ai/insights'),
  getFailurePatterns: (data) => api.post('/ai/failure-patterns', data),
  getCoachingMessage: (data) => api.post('/ai/coaching-message', data),
  getWeeklyReview: (data) => api.post('/ai/weekly-review', data),
};

export const notificationAPI = {
  getPending: () => api.get('/notifications'),
  subscribe: (subscription) => api.post('/notifications/subscribe', { subscription })
};

export default api;
