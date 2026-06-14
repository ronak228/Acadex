import apiClient from './apiClient';

const batchService = {
  getBatches: async (filters = {}) => {
    const response = await apiClient.get('/batches', { params: filters });
    return response.data;
  },

  getBatchById: async (id) => {
    const response = await apiClient.get(`/batches/${id}`);
    return response.data.data;
  },

  createBatch: async (data) => {
    const response = await apiClient.post('/batches', data);
    return { success: true, ...response.data };
  },

  updateBatch: async (id, data) => {
    const response = await apiClient.put(`/batches/${id}`, data);
    return { success: true, ...response.data };
  },

  toggleBatchStatus: async (id) => {
    const response = await apiClient.patch(`/batches/${id}/toggle-status`);
    return { success: true, ...response.data };
  },

  getBatchStudents: async (id) => {
    const response = await apiClient.get(`/batches/${id}/students`);
    return response.data.data;
  }
};

export default batchService;
