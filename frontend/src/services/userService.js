import apiClient from './apiClient';

const userService = {
  getAllUsers: async (filters = {}) => {
    const response = await apiClient.get('/users', { params: filters });
    return response.data;
  },

  toggleUserActive: async (id) => {
    const response = await apiClient.patch(`/users/${id}/toggle-active`);
    return { success: true, ...response.data };
  },

  changeUserRole: async (id, role) => {
    const response = await apiClient.patch(`/users/${id}/change-role`, { role });
    return { success: true, ...response.data };
  },

  resetUserPassword: async (id, password) => {
    const response = await apiClient.patch(`/users/${id}/reset-password`, { password });
    return { success: true, ...response.data };
  }
};

export default userService;
