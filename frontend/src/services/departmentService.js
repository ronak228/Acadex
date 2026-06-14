import apiClient from './apiClient';

const departmentService = {
  getDepartments: async (filters = {}) => {
    const response = await apiClient.get('/departments', { params: filters });
    return response.data.departments || response.data;
  },

  createDepartment: async (data) => {
    const response = await apiClient.post('/departments', data);
    return { success: true, ...response.data };
  },

  updateDepartment: async (id, data) => {
    const response = await apiClient.put(`/departments/${id}`, data);
    return { success: true, ...response.data };
  },

  toggleDepartmentStatus: async (id) => {
    const response = await apiClient.patch(`/departments/${id}/toggle-status`);
    return { success: true, ...response.data };
  }
};

export default departmentService;
