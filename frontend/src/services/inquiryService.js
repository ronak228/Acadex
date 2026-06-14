import apiClient from './apiClient';

const inquiryService = {
  getInquiries: async (filters = {}) => {
    const response = await apiClient.get('/inquiries', { params: filters });
    return response.data.inquiries || response.data;
  },

  getInquiryById: async (id) => {
    const response = await apiClient.get(`/inquiries/${id}`);
    return response.data.inquiry || response.data;
  },

  createInquiry: async (data) => {
    const response = await apiClient.post('/inquiries', data);
    return { success: true, ...response.data };
  },

  updateInquiry: async (id, data) => {
    const response = await apiClient.put(`/inquiries/${id}`, data);
    return { success: true, ...response.data };
  },

  deleteInquiry: async (id) => {
    const response = await apiClient.delete(`/inquiries/${id}`);
    return { success: true, ...response.data };
  },

  getStaffUsers: async () => {
    const response = await apiClient.get('/users/staff');
    return response.data.staff || response.data;
  }
};

export default inquiryService;
