const express = require('express');
const router = express.Router();
const {
  createFaculty,
  getFaculty,
  getFacultyById,
  getMyFaculty,
  updateFaculty,
  toggleFacultyStatus
} = require('../controllers/facultyController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/v1/faculty
 * @desc    List all faculty profiles (filterable)
 * @access  Private (ADMIN only)
 */
router.get('/', authenticate, authorize('ADMIN'), getFaculty);

/**
 * @route   POST /api/v1/faculty
 * @desc    Create faculty and associated user account
 * @access  Private (ADMIN only)
 */
router.post('/', authenticate, authorize('ADMIN'), createFaculty);

/**
 * @route   GET /api/v1/faculty/me
 * @desc    Get own faculty profile
 * @access  Private (FACULTY)
 */
router.get('/me', authenticate, authorize('FACULTY'), getMyFaculty);

/**
 * @route   GET /api/v1/faculty/:id
 * @desc    Get faculty details
 * @access  Private (ADMIN, FACULTY - own only)
 */
router.get('/:id', authenticate, authorize('ADMIN', 'FACULTY'), getFacultyById);

/**
 * @route   PUT /api/v1/faculty/:id
 * @desc    Update faculty details
 * @access  Private (ADMIN only)
 */
router.put('/:id', authenticate, authorize('ADMIN'), updateFaculty);

/**
 * @route   PATCH /api/v1/faculty/:id/toggle-status
 * @desc    Activate or deactivate faculty profile & user account
 * @access  Private (ADMIN only)
 */
router.patch('/:id/toggle-status', authenticate, authorize('ADMIN'), toggleFacultyStatus);

module.exports = router;
