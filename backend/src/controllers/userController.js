const prisma = require('../db');
const bcrypt = require('bcryptjs');

/**
 * @desc    Get all staff users (ADMIN, SUPER_ADMIN, RECEPTIONIST)
 * @route   GET /api/v1/users/staff
 * @access  Private (Admin, Receptionist)
 */
const getStaffUsers = async (req, res, next) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json(staff);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all system user accounts (filterable)
 * @route   GET /api/v1/users
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const where = {};

    if (role) {
      where.role = role.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle user account active status
 * @route   PATCH /api/v1/users/:id/toggle-active
 * @access  Private (Admin only)
 */
const toggleUserActive = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: !user.isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    return res.status(200).json({
      message: `User ${updatedUser.name} active status updated successfully.`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change user account role
 * @route   PATCH /api/v1/users/:id/change-role
 * @access  Private (Admin only)
 */
const changeUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Role is required.' });
    }

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT', 'RECEPTIONIST'];
    const uppercaseRole = role.toUpperCase();
    if (!validRoles.includes(uppercaseRole)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    if (id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }

    if (uppercaseRole === 'FACULTY') {
      return res.status(400).json({ message: 'Use the faculty creation endpoint to assign the FACULTY role.' });
    }
    if (uppercaseRole === 'STUDENT') {
      return res.status(400).json({ message: 'Use the enrollment endpoint to assign the STUDENT role.' });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role === uppercaseRole) {
      return res.status(400).json({ message: `User already has the ${uppercaseRole} role.` });
    }

    if (user.role === 'FACULTY') {
      const facultyProfile = await prisma.faculty.findUnique({ where: { userId: id } });
      if (facultyProfile) {
        return res.status(400).json({ message: 'User has a faculty profile. Deactivate or remove the faculty profile before changing the role.' });
      }
    }
    if (user.role === 'STUDENT') {
      const studentProfile = await prisma.student.findUnique({ where: { userId: id } });
      if (studentProfile) {
        return res.status(400).json({ message: 'User has a student profile. Enrolled students cannot have their role changed.' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: uppercaseRole
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return res.status(200).json({
      message: `Role for user ${updatedUser.name} updated to ${updatedUser.role} successfully.`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset user account password
 * @route   PATCH /api/v1/users/:id/reset-password
 * @access  Private (Admin only)
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.trim().length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    });

    return res.status(200).json({
      message: `Password reset successfully for user ${user.name}.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStaffUsers,
  getAllUsers,
  toggleUserActive,
  changeUserRole,
  resetUserPassword
};
