const express = require('express');
const router = express.Router();
const {
  getAssignments,
  createAssignment,
  updateAssignment,
  publishAssignment,
  closeAssignment,
  getSubmissions,
  submitAssignment,
  gradeSubmission
} = require('../controllers/assignmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, getAssignments);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), createAssignment);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), updateAssignment);
router.patch('/:id/publish', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), publishAssignment);
router.patch('/:id/close', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), closeAssignment);
router.get('/:id/submissions', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), getSubmissions);
router.post('/:id/submit', authenticate, authorize('STUDENT'), submitAssignment);
router.patch('/:id/grade/:studentId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), gradeSubmission);

module.exports = router;
