const express = require('express');
const router = express.Router();
const {
  getStaffUsers,
  getAllUsers,
  toggleUserActive,
  changeUserRole,
  resetUserPassword
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/v1/users/staff
 * @desc    Get all staff users (ADMIN, SUPER_ADMIN, RECEPTIONIST)
 * @access  Private (ADMIN, SUPER_ADMIN, RECEPTIONIST)
 */
router.get(
  '/staff',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'),
  getStaffUsers
);

/**
 * @route   GET /api/v1/users
 * @desc    Get all system user accounts (filterable)
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  getAllUsers
);

/**
 * @route   PATCH /api/v1/users/:id/toggle-active
 * @desc    Toggle user active status
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.patch(
  '/:id/toggle-active',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  toggleUserActive
);

/**
 * @route   PATCH /api/v1/users/:id/change-role
 * @desc    Change user role
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.patch(
  '/:id/change-role',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  changeUserRole
);

/**
 * @route   PATCH /api/v1/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
router.patch(
  '/:id/reset-password',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  resetUserPassword
);

module.exports = router;
