import apiClient from './apiClient';

const designationService = {
  getDesignations: async (filters = {}) => {
    const response = await apiClient.get('/designations', { params: filters });
    return response.data.designations || response.data;
  },

  createDesignation: async (data) => {
    const response = await apiClient.post('/designations', data);
    return { success: true, ...response.data };
  },

  updateDesignation: async (id, data) => {
    const response = await apiClient.put(`/designations/${id}`, data);
    return { success: true, ...response.data };
  },

  toggleDesignationStatus: async (id) => {
    const response = await apiClient.patch(`/designations/${id}/toggle-status`);
    return { success: true, ...response.data };
  }
};

export default designationService;
