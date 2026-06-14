import apiClient from './apiClient';

const reportService = {
  getRevenue: async (filters = {}) => {
    const res = await apiClient.get('/reports/revenue', { params: filters });
    return res.data;
  },
  getAttendance: async (filters = {}) => {
    const res = await apiClient.get('/reports/attendance', { params: filters });
    return res.data;
  },
  getAcademic: async (filters = {}) => {
    const res = await apiClient.get('/reports/academic', { params: filters });
    return res.data;
  },
  getExamination: async (filters = {}) => {
    const res = await apiClient.get('/reports/examination', { params: filters });
    return res.data;
  },
  getPerformance: async (filters = {}) => {
    const res = await apiClient.get('/reports/performance', { params: filters });
    return res.data;
  },
  getConversion: async (filters = {}) => {
    const res = await apiClient.get('/reports/conversion', { params: filters });
    return res.data;
  },
  getDueFees: async (filters = {}) => {
    const res = await apiClient.get('/reports/due-fees', { params: filters });
    return res.data;
  }
};

export default reportService;
