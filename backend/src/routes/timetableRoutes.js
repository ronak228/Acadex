const express = require('express');
const router = express.Router();
const {
  getTimetable,
  createSlot,
  updateSlot,
  deleteSlot,
  getBatchTimetable,
  getFacultyTimetable
} = require('../controllers/timetableController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, getTimetable);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createSlot);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateSlot);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteSlot);
router.get('/batch/:batchId', authenticate, getBatchTimetable);
router.get('/faculty/:facultyId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), getFacultyTimetable);

module.exports = router;
