const express = require('express');
const router = express.Router();
const {
  getFeeStructures,
  createFeeStructure,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  toggleFeeStructureStatus,
  addInstallment,
  updateInstallment,
  deleteInstallment,
  assignFee,
  getStudentFee,
  applyDiscount,
  applyScholarship,
  collectFee,
  getPayments,
  getReceipt,
  getDueFees,
  getStudentDueFees,
  getDiscounts,
  createDiscount,
  updateDiscount,
  getScholarships,
  createScholarship,
  updateScholarship
} = require('../controllers/feeController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const adminOnly = authorize('ADMIN', 'SUPER_ADMIN');

// Fee Structures
router.get('/structures', authenticate, adminOnly, getFeeStructures);
router.post('/structures', authenticate, adminOnly, createFeeStructure);
router.get('/structures/:id', authenticate, adminOnly, getFeeStructureById);
router.put('/structures/:id', authenticate, adminOnly, updateFeeStructure);
router.patch('/structures/:id/toggle-status', authenticate, adminOnly, toggleFeeStructureStatus);
router.delete('/structures/:id', authenticate, adminOnly, deleteFeeStructure);

// Installments
router.post('/structures/:id/installments', authenticate, adminOnly, addInstallment);
router.put('/installments/:id', authenticate, adminOnly, updateInstallment);
router.delete('/installments/:id', authenticate, adminOnly, deleteInstallment);

// Student Fee Assignment
router.post('/assign', authenticate, adminOnly, assignFee);
router.get('/student/:studentId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'STUDENT'), getStudentFee);
router.patch('/student/:id/discount', authenticate, adminOnly, applyDiscount);
router.patch('/student/:id/scholarship', authenticate, adminOnly, applyScholarship);

// Fee Collection
router.post('/collect', authenticate, adminOnly, collectFee);
router.get('/payments', authenticate, adminOnly, getPayments);
router.get('/receipt/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'STUDENT'), getReceipt);

// Due Fee Tracking
router.get('/due', authenticate, adminOnly, getDueFees);
router.get('/due/:studentId', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'STUDENT'), getStudentDueFees);

// Discounts
router.get('/discounts', authenticate, adminOnly, getDiscounts);
router.post('/discounts', authenticate, adminOnly, createDiscount);
router.put('/discounts/:id', authenticate, adminOnly, updateDiscount);

// Scholarships
router.get('/scholarships', authenticate, adminOnly, getScholarships);
router.post('/scholarships', authenticate, adminOnly, createScholarship);
router.put('/scholarships/:id', authenticate, adminOnly, updateScholarship);

module.exports = router;
