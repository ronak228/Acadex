const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getRevenueReport,
  getAttendanceReport,
  getAcademicReport,
  getExaminationReport,
  getPerformanceReport,
  getConversionReport,
  getDueFeeReport
} = require('../controllers/reportController');

router.get('/revenue',     authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getRevenueReport);
router.get('/attendance',  authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), getAttendanceReport);
router.get('/academic',    authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), getAcademicReport);
router.get('/examination', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), getExaminationReport);
router.get('/performance', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY', 'STUDENT'), getPerformanceReport);
router.get('/conversion',  authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getConversionReport);
router.get('/due-fees',    authenticate, authorize('ADMIN', 'SUPER_ADMIN'), getDueFeeReport);

module.exports = router;
