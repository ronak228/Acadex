const express = require('express');
const router = express.Router();
const { getMaterials, createMaterial, updateMaterial, deleteMaterial } = require('../controllers/materialController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, getMaterials);
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), createMaterial);
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN', 'FACULTY'), updateMaterial);
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), deleteMaterial);

module.exports = router;
