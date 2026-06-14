import apiClient from './apiClient';

const questionService = {
  getQuestions: async (filters = {}) => {
    const response = await apiClient.get('/question-bank', { params: filters });
    return response.data;
  },

  createQuestion: async (data) => {
    const response = await apiClient.post('/question-bank', data);
    return { success: true, ...response.data };
  },

  updateQuestion: async (id, data) => {
    const response = await apiClient.put(`/question-bank/${id}`, data);
    return { success: true, ...response.data };
  },

  deleteQuestion: async (id) => {
    const response = await apiClient.delete(`/question-bank/${id}`);
    return { success: true, ...response.data };
  }
};

export default questionService;
