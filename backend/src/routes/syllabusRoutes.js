const express = require('express');
const router = express.Router();
const {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getBatchProgress,
  toggleUnitCoverage
} = require('../controllers/syllabusController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/units', authenticate, getUnits);
router.post('/units', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createUnit);
router.put('/units/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateUnit);
router.delete('/units/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteUnit);
router.get('/progress/:batchId', authenticate, getBatchProgress);
router.patch('/progress/:unitId/:batchId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), toggleUnitCoverage);

module.exports = router;
