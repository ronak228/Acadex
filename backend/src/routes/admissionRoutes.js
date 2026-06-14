const express = require('express');
const router = express.Router();
const {
  createAdmission,
  getAdmissions,
  getAdmissionById,
  updateAdmissionStatus,
  enrollAdmission
} = require('../controllers/admissionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/v1/admissions
 * @desc    Get all admission applications (filterable)
 * @access  Private (ADMIN, SUPER_ADMIN, RECEPTIONIST)
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'),
  getAdmissions
);

/**
 * @route   GET /api/v1/admissions/:id
 * @desc    Get details of a specific application
 * @access  Private (ADMIN, SUPER_ADMIN, RECEPTIONIST)
 */
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'),
  getAdmissionById
);

/**
 * @route   POST /api/v1/admissions
 * @desc    Create a new admission application
 * @access  Private (ADMIN, SUPER_ADMIN, RECEPTIONIST)
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'),
  createAdmission
);

/**
 * @route   PATCH /api/v1/admissions/:id/status
 * @desc    Approve or reject an application
 * @access  Private (ADMIN, SUPER_ADMIN only)
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  updateAdmissionStatus
);

/**
 * @route   POST /api/v1/admissions/:id/enroll
 * @desc    Convert an approved admission to student
 * @access  Private (ADMIN, SUPER_ADMIN only)
 */
router.post(
  '/:id/enroll',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  enrollAdmission
);

module.exports = router;
