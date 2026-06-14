const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const prisma = require('../db');

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Inactive account'
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Sign JWT
    // JWT Payload: { userId, role, email }
    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email
    });

    // Return token and user (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Invalidate token / Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    // Since JWT is stateless, client handles clearing the token.
    // This endpoint acts as a success confirmation.
    return res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the authenticate middleware
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Inactive account'
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change current user password
 * @route   PUT /api/v1/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long'
      });
    }

    // req.user is attached by the authenticate middleware
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        message: 'Unauthorized'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Incorrect current password'
      });
    }

    // Hash the new password (bcrypt salt rounds: 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, mustChangePassword: false }
    });

    return res.status(200).json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user name/phone
 * @route   PATCH /api/v1/auth/me
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name && phone === undefined) {
      return res.status(400).json({ message: 'Provide at least name or phone to update.' });
    }
    const data = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'name must be a non-empty string.' });
      }
      data.name = name.trim();
    }
    if (phone !== undefined) data.phone = phone || null;
    const updated = await prisma.user.update({ where: { id: req.user.userId }, data });
    const { password: _, ...userWithoutPassword } = updated;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getMe,
  changePassword,
  updateProfile
};
