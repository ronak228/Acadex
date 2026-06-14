import apiClient from './apiClient';

const resultService = {
  // GET  /exams/:examId/results  — all results for a specific exam (Admin/Faculty)
  getResultsByExam: async (examId) => {
    const response = await apiClient.get(`/exams/${examId}/results`);
    return response.data;
  },

  // POST /exams/:examId/results  — bulk upsert results (Admin/Faculty)
  saveBulkResults: async (examId, results) => {
    const response = await apiClient.post(`/exams/${examId}/results`, { results });
    return { success: true, ...response.data };
  },

  // GET  /students/my-results    — logged-in student's own results (Student only)
  getMyResults: async () => {
    const response = await apiClient.get('/students/my-results');
    return response.data;
  }
};

export default resultService;
