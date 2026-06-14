const express = require('express');
const router = express.Router();
const {
  getCourses,
  createCourse,
  getCourseById,
  updateCourse,
  toggleCourseStatus
} = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, getCourses);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createCourse);
router.get('/:id', authenticate, getCourseById);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateCourse);
router.patch('/:id/toggle-status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), toggleCourseStatus);

module.exports = router;
