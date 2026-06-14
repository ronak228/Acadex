import apiClient from './apiClient';

const subjectService = {
  getSubjects: async (filters = {}) => {
    const response = await apiClient.get('/subjects', { params: filters });
    return response.data;
  },

  getSubjectById: async (id) => {
    const response = await apiClient.get(`/subjects/${id}`);
    return response.data;
  },

  createSubject: async (data) => {
    const response = await apiClient.post('/subjects', data);
    return { success: true, ...response.data };
  },

  updateSubject: async (id, data) => {
    const response = await apiClient.put(`/subjects/${id}`, data);
    return { success: true, ...response.data };
  },

  deleteSubject: async (id) => {
    const response = await apiClient.delete(`/subjects/${id}`);
    return { success: true, ...response.data };
  },

  toggleSubjectStatus: async (id) => {
    const response = await apiClient.patch(`/subjects/${id}/toggle-status`);
    return { success: true, ...response.data };
  }
};

export default subjectService;
