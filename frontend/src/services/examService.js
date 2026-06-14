import apiClient from './apiClient';

const examService = {
  getExams: async (filters = {}) => {
    const response = await apiClient.get('/exams', { params: filters });
    return response.data;
  },

  getExamById: async (id) => {
    const response = await apiClient.get(`/exams/${id}`);
    return response.data.data ?? response.data;
  },

  createExam: async (data) => {
    const response = await apiClient.post('/exams', data);
    return { success: true, ...response.data };
  },

  updateExam: async (id, data) => {
    const response = await apiClient.put(`/exams/${id}`, data);
    return { success: true, ...response.data };
  },

  deleteExam: async (id) => {
    const response = await apiClient.delete(`/exams/${id}`);
    return { success: true, ...response.data };
  }
};

export default examService;
