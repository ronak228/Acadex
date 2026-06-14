const express = require('express');
const router = express.Router();

const { createExam, getExams, getExamById, updateExam, deleteExam } = require('../controllers/examController');
const { submitBulkResults, getExamResults, updateSingleResult } = require('../controllers/resultController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Exam CRUD
router.get('/', authenticate, authorize('ADMIN', 'FACULTY', 'STUDENT'), getExams);
router.post('/', authenticate, authorize('ADMIN', 'FACULTY'), createExam);
router.get('/:id', authenticate, authorize('ADMIN', 'FACULTY', 'STUDENT'), getExamById);
router.put('/:id', authenticate, authorize('ADMIN', 'FACULTY'), updateExam);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteExam);

// Result operations (nested under exam)
router.get('/:id/results', authenticate, authorize('ADMIN', 'FACULTY'), getExamResults);
router.post('/:id/results', authenticate, authorize('ADMIN', 'FACULTY'), submitBulkResults);
router.put('/:id/results/:studentId', authenticate, authorize('ADMIN', 'FACULTY'), updateSingleResult);

module.exports = router;
