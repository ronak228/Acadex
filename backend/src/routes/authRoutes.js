const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login, logout, getMe, changePassword, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user & get token
 * @access  Public
 */
router.post('/login', loginLimiter, login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user / invalidate session
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change own password
 * @access  Private
 */
router.put('/change-password', authenticate, changePassword);

/**
 * @route   PATCH /api/v1/auth/me
 * @desc    Update current user name/phone
 * @access  Private
 */
router.patch('/me', authenticate, updateProfile);

module.exports = router;
