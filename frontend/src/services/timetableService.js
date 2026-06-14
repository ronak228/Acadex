import apiClient from './apiClient';

const timetableService = {
  getTimetable: async (filters = {}) => {
    const response = await apiClient.get('/timetable', { params: filters });
    return response.data.data;
  },

  getBatchTimetable: async (batchId) => {
    const response = await apiClient.get(`/timetable/batch/${batchId}`);
    return response.data.data;
  },

  getFacultyTimetable: async (facultyId) => {
    const response = await apiClient.get(`/timetable/faculty/${facultyId}`);
    return response.data.data;
  },

  createSlot: async (data) => {
    const response = await apiClient.post('/timetable', data);
    return { success: true, ...response.data };
  },

  updateSlot: async (id, data) => {
    const response = await apiClient.put(`/timetable/${id}`, data);
    return { success: true, ...response.data };
  },

  deleteSlot: async (id) => {
    const response = await apiClient.delete(`/timetable/${id}`);
    return { success: true, ...response.data };
  }
};

export default timetableService;
