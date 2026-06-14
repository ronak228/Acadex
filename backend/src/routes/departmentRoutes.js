const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  toggleDepartmentStatus
} = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, getDepartments);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), createDepartment);
router.get('/:id', authenticate, getDepartmentById);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), updateDepartment);
router.patch('/:id/toggle-status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), toggleDepartmentStatus);

module.exports = router;
