const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  getMyStudent,
  updateStudent,
  deleteStudent,
  getStudentResults,
  getMyResults
} = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/v1/students
 * @desc    List all students (filterable)
 * @access  Private (ADMIN, FACULTY)
 */
router.get('/', authenticate, authorize('ADMIN', 'FACULTY'), getStudents);

/**
 * @route   POST /api/v1/students
 * @desc    Create student and user account
 * @access  Private (ADMIN)
 */
router.post('/', authenticate, authorize('ADMIN'), createStudent);

/**
 * @route   GET /api/v1/students/me
 * @desc    Get own student profile
 * @access  Private (STUDENT only)
 * NOTE: must be registered before /:id to avoid "me" being treated as an ID
 */
router.get('/me', authenticate, authorize('STUDENT'), getMyStudent);

/**
 * @route   GET /api/v1/students/my-results
 * @desc    Get exam results for the currently logged-in student
 * @access  Private (STUDENT only)
 * NOTE: must be registered before /:id to avoid "my-results" being treated as an ID
 */
router.get('/my-results', authenticate, authorize('STUDENT'), getMyResults);

/**
 * @route   GET /api/v1/students/:id
 * @desc    Get student details
 * @access  Private (ADMIN, FACULTY, STUDENT)
 */
router.get('/:id', authenticate, authorize('ADMIN', 'FACULTY', 'STUDENT'), getStudentById);

/**
 * @route   PUT /api/v1/students/:id
 * @desc    Update student details
 * @access  Private (ADMIN)
 */
router.put('/:id', authenticate, authorize('ADMIN'), updateStudent);
router.patch('/:id/toggle-status', authenticate, authorize('ADMIN'), updateStudent);

/**
 * @route   DELETE /api/v1/students/:id
 * @desc    Soft delete student
 * @access  Private (ADMIN)
 */
router.delete('/:id', authenticate, authorize('ADMIN'), deleteStudent);

/**
 * @route   GET /api/v1/students/:id/results
 * @desc    Get exam results for student
 * @access  Private (ADMIN, FACULTY, STUDENT)
 */
router.get('/:id/results', authenticate, authorize('ADMIN', 'FACULTY', 'STUDENT'), getStudentResults);

module.exports = router;
