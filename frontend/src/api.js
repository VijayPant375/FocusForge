import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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

export const authAPI = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
};

export const habitAPI = {
  create: (data) => api.post('/habits', data),
  getAll: () => api.get('/habits'),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  complete: (id) => api.post(`/habits/${id}/complete`),
};

export const analyticsAPI = {
  getStats: () => api.get('/analytics/stats'),
  getWeekly: () => api.get('/analytics/weekly'),
};

export const aiAPI = {
  getInsights: () => api.get('/ai/insights'),
};

export default api;
