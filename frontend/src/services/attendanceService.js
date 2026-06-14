import apiClient from './apiClient';

const attendanceService = {
  markAttendance: async (attendanceData) => {
    const response = await apiClient.post('/attendance/faculty', attendanceData);
    return { success: true, ...response.data };
  },

  getAttendanceList: async (filters = {}) => {
    const response = await apiClient.get('/attendance/faculty', { params: filters });
    return response.data.records || response.data;
  },

  getFacultySummary: async (facultyId, month, year) => {
    const response = await apiClient.get(`/attendance/faculty/${facultyId}/summary`, { params: { month, year } });
    return response.data;
  },

  getBulkFacultySummary: async (month, year) => {
    const response = await apiClient.get('/attendance/faculty/summary-bulk', { params: { month, year } });
    return response.data;
  }
};

export default attendanceService;
