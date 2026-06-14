import apiClient from './apiClient';

const analyticsService = {
  // GET /exams — filtered exam list
  getExams: async (filters = {}) => {
    const response = await apiClient.get('/exams', { params: filters });
    return response.data;
  },

  // GET /exams/:id/results — results for one exam (flat shape: { studentId, studentName, rollNumber, marksObtained, status })
  getResultsForExam: async (examId) => {
    const response = await apiClient.get(`/exams/${examId}/results`);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Fetch results for many exams in parallel; returns array-of-arrays indexed by examId order
  getResultsForExams: async (examIds) => {
    if (!examIds.length) return [];
    const responses = await Promise.all(
      examIds.map((id) =>
        apiClient.get(`/exams/${id}/results`)
          .then((r) => (Array.isArray(r.data) ? r.data : []))
          .catch(() => [])
      )
    );
    return responses;
  }
};

export default analyticsService;
