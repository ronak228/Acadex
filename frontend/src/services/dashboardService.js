import apiClient from './apiClient';

const dashboardService = {
  getDashboard: async () => {
    const res = await apiClient.get('/dashboard');
    return res.data;
  }
};

export default dashboardService;
