const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry
} = require('../controllers/inquiryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/v1/inquiries
 * @desc    Get all inquiries (filterable)
 * @access  Private (ADMIN, SUPER_ADMIN, RECEPTIONIST)
 */
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'), getInquiries);

/**
 * @route   GET /api/v1/inquiries/:id
 * @desc    Get inquiry details by ID
 * @access  Private (ADMIN, SUPER_ADMIN, RECEPTIONIST)
 */
router.get('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'), getInquiryById);

/**
 * @route   POST /api/v1/inquiries
 * @desc    Create a new prospective student inquiry
 * @access  Private (ADMIN, SUPER_ADMIN, RECEPTIONIST)
 */
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'), createInquiry);

/**
 * @route   PUT /api/v1/inquiries/:id
 * @desc    Update inquiry details
 * @access  Private (ADMIN, SUPER_ADMIN, RECEPTIONIST)
 */
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'), updateInquiry);

/**
 * @route   DELETE /api/v1/inquiries/:id
 * @desc    Soft delete an inquiry (sets status to DROPPED)
 * @access  Private (ADMIN, SUPER_ADMIN only)
 */
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteInquiry);

module.exports = router;
