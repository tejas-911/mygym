import apiClient from './api';

export const paymentService = {
  getAll: () => apiClient.get('/payments'),
  getStats: () => apiClient.get('/payments/stats'),
  getTrend: (mode = 'monthly') => apiClient.get(`/payments/trend/${mode}`),
  create: (data) => apiClient.post('/payments', data),
  updateStatus: (id, status) => apiClient.patch(`/payments/${id}`, { status }),
};
