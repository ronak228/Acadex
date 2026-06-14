const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendanceList,
  getMonthlySummary,
  getBulkMonthlySummary
} = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/attendance/faculty
 * @desc    Mark or update faculty attendance (Upsert)
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.post(
  '/faculty',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  markAttendance
);

/**
 * @route   GET /api/v1/attendance/faculty
 * @desc    Get all faculty attendance records (filterable)
 * @access  Private (ADMIN, SUPER_ADMIN, FACULTY)
 */
router.get(
  '/faculty',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  getAttendanceList
);

/**
 * @route   GET /api/v1/attendance/faculty/summary-bulk
 * @desc    Get monthly summary for all active faculty members in bulk
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.get(
  '/faculty/summary-bulk',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  getBulkMonthlySummary
);

/**
 * @route   GET /api/v1/attendance/faculty/:facultyId/summary
 * @desc    Get monthly summary for a specific faculty member
 * @access  Private (ADMIN, SUPER_ADMIN, FACULTY)
 */
router.get(
  '/faculty/:facultyId/summary',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  getMonthlySummary
);

module.exports = router;
