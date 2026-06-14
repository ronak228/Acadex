import apiClient from './apiClient';

const feeService = {
  // Fee Structures
  getStructures: async (filters = {}) => {
    const res = await apiClient.get('/fees/structures', { params: filters });
    return res.data;
  },
  getStructureById: async (id) => {
    const res = await apiClient.get(`/fees/structures/${id}`);
    return res.data;
  },
  createStructure: async (data) => {
    const res = await apiClient.post('/fees/structures', data);
    return res.data;
  },
  updateStructure: async (id, data) => {
    const res = await apiClient.put(`/fees/structures/${id}`, data);
    return res.data;
  },
  deleteStructure: async (id) => {
    const res = await apiClient.delete(`/fees/structures/${id}`);
    return res.data;
  },
  toggleStructureStatus: async (id) => {
    const res = await apiClient.patch(`/fees/structures/${id}/toggle-status`);
    return res.data;
  },

  // Installments
  addInstallment: async (structureId, data) => {
    const res = await apiClient.post(`/fees/structures/${structureId}/installments`, data);
    return res.data;
  },
  updateInstallment: async (id, data) => {
    const res = await apiClient.put(`/fees/installments/${id}`, data);
    return res.data;
  },
  deleteInstallment: async (id) => {
    const res = await apiClient.delete(`/fees/installments/${id}`);
    return res.data;
  },

  // Student Fee Assignment
  assignFee: async (data) => {
    const res = await apiClient.post('/fees/assign', data);
    return res.data;
  },
  getStudentFee: async (studentId) => {
    const res = await apiClient.get(`/fees/student/${studentId}`);
    return res.data;
  },
  applyDiscount: async (studentFeeId, discountId) => {
    const res = await apiClient.patch(`/fees/student/${studentFeeId}/discount`, { discountId });
    return res.data;
  },
  applyScholarship: async (studentFeeId, scholarshipId) => {
    const res = await apiClient.patch(`/fees/student/${studentFeeId}/scholarship`, { scholarshipId });
    return res.data;
  },

  // Fee Collection
  collectFee: async (data) => {
    const res = await apiClient.post('/fees/collect', data);
    return res.data;
  },
  getPayments: async (filters = {}) => {
    const res = await apiClient.get('/fees/payments', { params: filters });
    return res.data;
  },
  getReceipt: async (id) => {
    const res = await apiClient.get(`/fees/receipt/${id}`);
    return res.data;
  },

  // Due Fees
  getDueFees: async () => {
    const res = await apiClient.get('/fees/due');
    return res.data;
  },
  getStudentDueFees: async (studentId) => {
    const res = await apiClient.get(`/fees/due/${studentId}`);
    return res.data;
  },

  // Discounts
  getDiscounts: async () => {
    const res = await apiClient.get('/fees/discounts');
    return res.data;
  },
  createDiscount: async (data) => {
    const res = await apiClient.post('/fees/discounts', data);
    return res.data;
  },
  updateDiscount: async (id, data) => {
    const res = await apiClient.put(`/fees/discounts/${id}`, data);
    return res.data;
  },

  // Scholarships
  getScholarships: async () => {
    const res = await apiClient.get('/fees/scholarships');
    return res.data;
  },
  createScholarship: async (data) => {
    const res = await apiClient.post('/fees/scholarships', data);
    return res.data;
  },
  updateScholarship: async (id, data) => {
    const res = await apiClient.put(`/fees/scholarships/${id}`, data);
    return res.data;
  }
};

export default feeService;
