import apiClient from './apiClient';

const syllabusService = {
  getUnits: async (filters = {}) => {
    const response = await apiClient.get('/syllabus/units', { params: filters });
    return response.data.data;
  },

  createUnit: async (data) => {
    const response = await apiClient.post('/syllabus/units', data);
    return { success: true, ...response.data };
  },

  updateUnit: async (id, data) => {
    const response = await apiClient.put(`/syllabus/units/${id}`, data);
    return { success: true, ...response.data };
  },

  deleteUnit: async (id) => {
    const response = await apiClient.delete(`/syllabus/units/${id}`);
    return { success: true, ...response.data };
  },

  getBatchProgress: async (batchId, filters = {}) => {
    const response = await apiClient.get(`/syllabus/progress/${batchId}`, { params: filters });
    return response.data.data;
  },

  toggleCoverage: async (unitId, batchId) => {
    const response = await apiClient.patch(`/syllabus/progress/${unitId}/${batchId}`);
    return { success: true, ...response.data };
  }
};

export default syllabusService;
