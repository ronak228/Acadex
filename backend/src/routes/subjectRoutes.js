const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  toggleSubjectStatus
} = require('../controllers/subjectController');

router.get('/', authenticate, getSubjects);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createSubject);
router.get('/:id', authenticate, getSubjectById);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateSubject);
router.patch('/:id/toggle-status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), toggleSubjectStatus);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteSubject);

module.exports = router;
