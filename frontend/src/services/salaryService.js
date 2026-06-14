import apiClient from './apiClient';

const salaryService = {
  getSalaryRecords: async (filters = {}) => {
    const response = await apiClient.get('/salary', { params: filters });
    return response.data.records || response.data;
  },

  generateBulkSalary: async (month, year) => {
    const response = await apiClient.post('/salary/generate-bulk', { month, year });
    return { success: true, ...response.data };
  },

  updateSalaryRecord: async (id, data) => {
    const response = await apiClient.put(`/salary/${id}`, data);
    return { success: true, ...response.data };
  },

  markSalaryPaid: async (id, data = {}) => {
    const response = await apiClient.patch(`/salary/${id}/mark-paid`, data);
    return { success: true, ...response.data };
  },

  getFacultySalaryHistory: async (facultyId) => {
    const response = await apiClient.get(`/salary/faculty/${facultyId}`);
    return response.data.history || response.data;
  }
};

export default salaryService;
