const express = require('express');
const router = express.Router();
const {
  generateSalary,
  generateBulkSalary,
  getSalaryRecords,
  getSalaryRecordById,
  updateSalaryRecord,
  markSalaryPaid,
  getFacultySalaryHistory
} = require('../controllers/salaryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/v1/salary
 * @desc    Get all salary records (filterable)
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  getSalaryRecords
);

/**
 * @route   POST /api/v1/salary/generate
 * @desc    Generate monthly salary record
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.post(
  '/generate',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  generateSalary
);

/**
 * @route   POST /api/v1/salary/generate-bulk
 * @desc    Bulk generate salary records for all active faculty
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.post(
  '/generate-bulk',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  generateBulkSalary
);

/**
 * @route   GET /api/v1/salary/:id
 * @desc    Get salary record by ID
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  getSalaryRecordById
);

/**
 * @route   PUT /api/v1/salary/:id
 * @desc    Update an unpaid salary record (adjustments)
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  updateSalaryRecord
);

/**
 * @route   PATCH /api/v1/salary/:id/mark-paid
 * @desc    Mark salary record as paid
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.patch(
  '/:id/mark-paid',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  markSalaryPaid
);

/**
 * @route   GET /api/v1/salary/faculty/:facultyId
 * @desc    Get salary history for a specific faculty member
 * @access  Private (ADMIN, SUPER_ADMIN, FACULTY)
 */
router.get(
  '/faculty/:facultyId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  getFacultySalaryHistory
);

module.exports = router;
