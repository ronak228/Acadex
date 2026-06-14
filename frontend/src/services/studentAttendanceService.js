import apiClient from './apiClient';

const studentAttendanceService = {
  bulkMark: async (batchId, date, records) => {
    const response = await apiClient.post('/student-attendance/bulk', { batchId, date, records });
    return { success: true, ...response.data };
  },

  getAttendance: async (filters = {}) => {
    const response = await apiClient.get('/student-attendance', { params: filters });
    return response.data.data;
  },

  getStudentAttendance: async (studentId) => {
    const response = await apiClient.get(`/student-attendance/student/${studentId}`);
    return response.data.data;
  },

  getSummary: async (batchId) => {
    const response = await apiClient.get(`/student-attendance/summary/${batchId}`);
    return response.data.data;
  },

  correctRecord: async (id, data) => {
    const response = await apiClient.put(`/student-attendance/${id}`, data);
    return { success: true, ...response.data };
  }
};

export default studentAttendanceService;
