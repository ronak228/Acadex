import apiClient from './apiClient';

const materialService = {
  getMaterials: async (filters = {}) => {
    const response = await apiClient.get('/materials', { params: filters });
    return response.data.data;
  },

  createMaterial: async (data) => {
    const response = await apiClient.post('/materials', data);
    return { success: true, ...response.data };
  },

  updateMaterial: async (id, data) => {
    const response = await apiClient.put(`/materials/${id}`, data);
    return { success: true, ...response.data };
  },

  deleteMaterial: async (id) => {
    const response = await apiClient.delete(`/materials/${id}`);
    return { success: true, ...response.data };
  }
};

export default materialService;
