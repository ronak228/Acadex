import apiClient from './apiClient';

const studentService = {
  getStudents: async (filters = {}) => {
    const response = await apiClient.get('/students', { params: filters });
    return response.data.students || response.data;
  },

  getMyStudent: async () => {
    const response = await apiClient.get('/students/me');
    return response.data;
  },

  getCourses: async () => {
    const response = await apiClient.get('/courses');
    return response.data.courses || response.data;
  },

  getBatches: async (courseId = null) => {
    const response = await apiClient.get('/batches', { params: { courseId } });
    return response.data.batches || response.data;
  },

  deleteStudent: async (id) => {
    const response = await apiClient.delete(`/students/${id}`);
    return { success: true, ...response.data };
  },

  toggleStudentStatus: async (id, isActive) => {
    const response = await apiClient.patch(`/students/${id}/toggle-status`, { isActive });
    return { success: true, ...response.data };
  },

  createStudent: async (studentData) => {
    const response = await apiClient.post('/students', studentData);
    return { success: true, ...response.data };
  },

  getStudentById: async (id) => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data.student || response.data;
  },

  getStudentResults: async (id) => {
    const response = await apiClient.get(`/students/${id}/results`);
    return response.data.results || response.data;
  },

  updateStudent: async (id, studentData) => {
    const response = await apiClient.put(`/students/${id}`, studentData);
    return { success: true, ...response.data };
  }
};

export default studentService;
