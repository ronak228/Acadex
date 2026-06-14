const express = require('express');
const router = express.Router();
const {
  bulkMarkAttendance,
  getAttendance,
  getStudentAttendance,
  getAttendanceSummary,
  correctAttendance
} = require('../controllers/studentAttendanceController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/bulk', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), bulkMarkAttendance);
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), getAttendance);
router.get('/student/:studentId', authenticate, getStudentAttendance);
router.get('/summary/:batchId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), getAttendanceSummary);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), correctAttendance);

module.exports = router;
