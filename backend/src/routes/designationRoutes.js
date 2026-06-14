const express = require('express');
const router = express.Router();
const {
  getDesignations,
  createDesignation,
  getDesignationById,
  updateDesignation,
  toggleDesignationStatus
} = require('../controllers/designationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, getDesignations);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createDesignation);
router.get('/:id', authenticate, getDesignationById);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateDesignation);
router.patch('/:id/toggle-status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), toggleDesignationStatus);

module.exports = router;
