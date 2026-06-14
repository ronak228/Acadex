import apiClient from './apiClient';

const facultyService = {
  getFaculty: async (filters = {}) => {
    const response = await apiClient.get('/faculty', { params: filters });
    return response.data.faculty || response.data;
  },

  getMyFaculty: async () => {
    const response = await apiClient.get('/faculty/me');
    return response.data;
  },

  getFacultyById: async (id) => {
    const response = await apiClient.get(`/faculty/${id}`);
    return response.data.faculty || response.data;
  },

  createFaculty: async (data) => {
    const response = await apiClient.post('/faculty', data);
    return { success: true, ...response.data };
  },

  updateFaculty: async (id, data) => {
    const response = await apiClient.put(`/faculty/${id}`, data);
    return { success: true, ...response.data };
  },

  toggleFacultyStatus: async (id, isActive) => {
    const response = await apiClient.patch(`/faculty/${id}/toggle-status`, { isActive });
    return { success: true, ...response.data };
  }
};

export default facultyService;
