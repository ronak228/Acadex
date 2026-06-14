const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getDashboard } = require('../controllers/dashboardController');

router.get('/', authenticate, getDashboard);

module.exports = router;
