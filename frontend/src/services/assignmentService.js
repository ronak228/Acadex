import apiClient from './apiClient';

const assignmentService = {
  getAssignments: async (filters = {}) => {
    const response = await apiClient.get('/assignments', { params: filters });
    return response.data.data;
  },

  createAssignment: async (data) => {
    const response = await apiClient.post('/assignments', data);
    return { success: true, ...response.data };
  },

  updateAssignment: async (id, data) => {
    const response = await apiClient.put(`/assignments/${id}`, data);
    return { success: true, ...response.data };
  },

  publishAssignment: async (id) => {
    const response = await apiClient.patch(`/assignments/${id}/publish`);
    return { success: true, ...response.data };
  },

  closeAssignment: async (id) => {
    const response = await apiClient.patch(`/assignments/${id}/close`);
    return { success: true, ...response.data };
  },

  getSubmissions: async (assignmentId) => {
    const response = await apiClient.get(`/assignments/${assignmentId}/submissions`);
    return response.data.data;
  },

  submitAssignment: async (assignmentId) => {
    const response = await apiClient.post(`/assignments/${assignmentId}/submit`);
    return { success: true, ...response.data };
  },

  gradeSubmission: async (assignmentId, studentId, data) => {
    const response = await apiClient.patch(`/assignments/${assignmentId}/grade/${studentId}`, data);
    return { success: true, ...response.data };
  }
};

export default assignmentService;
