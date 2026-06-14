import apiClient from './apiClient';

const admissionService = {
  getAdmissions: async (filters = {}) => {
    const response = await apiClient.get('/admissions', { params: filters });
    return response.data.admissions || response.data;
  },

  getAdmissionById: async (id) => {
    const response = await apiClient.get(`/admissions/${id}`);
    return response.data.admission || response.data;
  },

  createAdmission: async (data) => {
    const response = await apiClient.post('/admissions', data);
    return { success: true, ...response.data };
  },

  updateAdmissionStatus: async (id, status, remarks) => {
    const response = await apiClient.patch(`/admissions/${id}/status`, { status, remarks });
    return { success: true, ...response.data };
  },

  enrollAdmission: async (id, studentDetails) => {
    const response = await apiClient.post(`/admissions/${id}/enroll`, studentDetails);
    return { success: true, ...response.data };
  }
};

export default admissionService;
