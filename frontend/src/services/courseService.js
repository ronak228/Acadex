import apiClient from './apiClient';

const courseService = {
  getCourses: async (filters = {}) => {
    const response = await apiClient.get('/courses', { params: filters });
    return response.data.courses || response.data;
  },

  getCourseById: async (id) => {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data.data;
  },

  createCourse: async (data) => {
    const response = await apiClient.post('/courses', data);
    return { success: true, ...response.data };
  },

  updateCourse: async (id, data) => {
    const response = await apiClient.put(`/courses/${id}`, data);
    return { success: true, ...response.data };
  },

  toggleCourseStatus: async (id) => {
    const response = await apiClient.patch(`/courses/${id}/toggle-status`);
    return { success: true, ...response.data };
  }
};

export default courseService;
