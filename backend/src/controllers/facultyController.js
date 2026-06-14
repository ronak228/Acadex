const prisma = require('../db');
const bcrypt = require('bcryptjs');
const { generateTempPassword } = require('../utils/helpers');

/**
 * @desc    Create a new faculty & user account
 * @route   POST /api/v1/faculty
 * @access  Private (Admin only)
 */
const createFaculty = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      designation,
      department,
      designationId,
      departmentId,
      dateOfJoining,
      qualification,
      bankAccount,
      ifscCode,
      baseSalary
    } = req.body;

    // Resolve designation: prefer DB record, fallback to free text
    let resolvedDesignation = designation;
    let resolvedDesignationId = null;
    if (designationId) {
      const desigRecord = await prisma.designation.findUnique({ where: { id: designationId } });
      if (!desigRecord) return res.status(400).json({ message: 'Selected designation not found.' });
      resolvedDesignation = desigRecord.name;
      resolvedDesignationId = desigRecord.id;
    }

    // Resolve department: prefer DB record, fallback to free text
    let resolvedDepartment = department || null;
    let resolvedDepartmentId = null;
    if (departmentId) {
      const deptRecord = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!deptRecord) return res.status(400).json({ message: 'Selected department not found.' });
      resolvedDepartment = deptRecord.name;
      resolvedDepartmentId = deptRecord.id;
    }

    // Validate required fields
    if (!name || !email || !phone || !qualification || !resolvedDesignation || !dateOfJoining || baseSalary === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: name, email, phone, qualification, designation, dateOfJoining, baseSalary.'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Full Name must be at least 2 characters.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (!/^\+?[\d\s\-().]{7,15}$/.test(phone.trim())) {
      return res.status(400).json({ message: 'Please provide a valid phone number (7–15 digits).' });
    }

    if (qualification.trim().length < 3) {
      return res.status(400).json({ message: 'Qualification must be at least 3 characters.' });
    }

    if (bankAccount && !/^\d{9,18}$/.test(bankAccount.trim())) {
      return res.status(400).json({ message: 'Bank account must be 9–18 digits.' });
    }

    if (ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifscCode.trim())) {
      return res.status(400).json({ message: 'IFSC code must be in format: ABCD0123456.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'A user with this email address already exists'
      });
    }

    // Parse dateOfJoining
    const joiningDate = new Date(dateOfJoining);
    if (isNaN(joiningDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid dateOfJoining format. Please provide a valid date.'
      });
    }

    // Parse and validate baseSalary
    const salary = parseFloat(baseSalary);
    if (isNaN(salary) || salary < 0) {
      return res.status(400).json({
        message: 'Invalid baseSalary. Please provide a positive numeric value.'
      });
    }

    // Generate unique employeeCode: FAC-<YEAR>-<SEQUENCE>
    const year = new Date().getFullYear();
    const prefix = `FAC-${year}-`;

    // Generate unique employee code with retry on concurrent collision
    let newFaculty;
    let tempPassword;
    for (let attempt = 0; attempt < 3; attempt++) {
      const lastFaculty = await prisma.faculty.findFirst({
        where: { employeeCode: { startsWith: prefix } },
        orderBy: { id: 'desc' }
      });
      let sequence = 1;
      if (lastFaculty) {
        const parts = lastFaculty.employeeCode.split('-');
        const n = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(n)) sequence = n + 1;
      }
      const employeeCode = `${prefix}${String(sequence).padStart(4, '0')}`;
      tempPassword = generateTempPassword();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      try {
        newFaculty = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              name,
              email: email.toLowerCase().trim(),
              password: hashedPassword,
              role: 'FACULTY',
              phone: phone || null,
              isActive: true,
              mustChangePassword: true
            }
          });
          return tx.faculty.create({
            data: {
              userId: user.id,
              employeeCode,
              designation: resolvedDesignation,
              department: resolvedDepartment,
              designationId: resolvedDesignationId,
              departmentId: resolvedDepartmentId,
              dateOfJoining: joiningDate,
              qualification: qualification || null,
              bankAccount: bankAccount || null,
              ifscCode: ifscCode || null,
              baseSalary: salary,
              isActive: true
            },
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, role: true, isActive: true } }
            }
          });
        });
        break;
      } catch (err) {
        if (err.code === 'P2002' && attempt < 2) continue;
        throw err;
      }
    }

    return res.status(201).json({
      message: 'Faculty profile and account created successfully',
      data: newFaculty,
      tempPassword
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all faculty profiles (filterable)
 * @route   GET /api/v1/faculty
 * @access  Private (Admin only)
 */
const getFaculty = async (req, res, next) => {
  try {
    const { department, designation, isActive, search } = req.query;

    const where = {};

    if (department) {
      where.department = { contains: department, mode: 'insensitive' };
    }

    if (designation) {
      where.designation = { contains: designation, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      const searchTrimmed = search.trim();
      where.OR = [
        { employeeCode: { contains: searchTrimmed, mode: 'insensitive' } },
        { designation: { contains: searchTrimmed, mode: 'insensitive' } },
        { department: { contains: searchTrimmed, mode: 'insensitive' } },
        { user: { name: { contains: searchTrimmed, mode: 'insensitive' } } },
        { user: { email: { contains: searchTrimmed, mode: 'insensitive' } } }
      ];
    }

    const facultyList = await prisma.faculty.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true, isActive: true }
        },
        designationRecord: { select: { id: true, name: true } },
        departmentRecord: { select: { id: true, name: true } }
      },
      orderBy: { employeeCode: 'asc' }
    });

    return res.status(200).json(facultyList);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get faculty details by ID
 * @route   GET /api/v1/faculty/:id
 * @access  Private (Admin, own Faculty)
 */
const getFacultyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true, isActive: true }
        },
        designationRecord: { select: { id: true, name: true } },
        departmentRecord: { select: { id: true, name: true } }
      }
    });

    if (!faculty) {
      return res.status(404).json({
        message: 'Faculty record not found'
      });
    }

    // Access control: Faculty can only view their own profile
    if (req.user.role === 'FACULTY' && faculty.userId !== req.user.userId) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own profile.'
      });
    }

    return res.status(200).json(faculty);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update faculty details
 * @route   PUT /api/v1/faculty/:id
 * @access  Private (Admin only)
 */
const updateFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      designation,
      department,
      designationId,
      departmentId,
      dateOfJoining,
      qualification,
      bankAccount,
      ifscCode,
      baseSalary,
      isActive
    } = req.body;

    // Check if faculty exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { id }
    });

    if (!existingFaculty) {
      return res.status(404).json({
        message: 'Faculty record not found'
      });
    }

    // Check if email is being updated and if it is already taken
    if (email && email.toLowerCase().trim() !== existingFaculty.email) {
      const user = await prisma.user.findUnique({
        where: { id: existingFaculty.userId }
      });
      if (user && email.toLowerCase().trim() !== user.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() }
        });
        if (emailTaken) {
          return res.status(400).json({
            message: 'A user with this email address already exists'
          });
        }
      }
    }

    let joiningDate;
    if (dateOfJoining) {
      joiningDate = new Date(dateOfJoining);
      if (isNaN(joiningDate.getTime())) {
        return res.status(400).json({
          message: 'Invalid dateOfJoining format'
        });
      }
    }

    let salary;
    if (baseSalary !== undefined) {
      salary = parseFloat(baseSalary);
      if (isNaN(salary) || salary <= 0) {
        return res.status(400).json({
          message: 'Invalid baseSalary. Please provide a positive numeric value.'
        });
      }
    }

    if (name !== undefined && name.trim().length < 2) {
      return res.status(400).json({ message: 'Full Name must be at least 2 characters.' });
    }

    if (phone !== undefined && phone.trim() && !/^\+?[\d\s\-().]{7,15}$/.test(phone.trim())) {
      return res.status(400).json({ message: 'Please provide a valid phone number (7–15 digits).' });
    }

    if (qualification !== undefined && qualification.trim().length < 3) {
      return res.status(400).json({ message: 'Qualification must be at least 3 characters.' });
    }

    if (bankAccount !== undefined && bankAccount.trim() && !/^\d{9,18}$/.test(bankAccount.trim())) {
      return res.status(400).json({ message: 'Bank account must be 9–18 digits.' });
    }

    if (ifscCode !== undefined && ifscCode.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifscCode.trim())) {
      return res.status(400).json({ message: 'IFSC code must be in format: ABCD0123456.' });
    }

    // Execute updates in a transaction
    const updatedFaculty = await prisma.$transaction(async (tx) => {
      // 1. Update associated User fields
      const userUpdateData = {};
      if (name) userUpdateData.name = name;
      if (email) userUpdateData.email = email.toLowerCase().trim();
      if (phone !== undefined) userUpdateData.phone = phone;
      if (isActive !== undefined) userUpdateData.isActive = isActive;

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: existingFaculty.userId },
          data: userUpdateData
        });
      }

      // 2. Update Faculty fields
      const facultyUpdateData = {};

      // Resolve designation
      if (designationId) {
        const desigRecord = await tx.designation.findUnique({ where: { id: designationId } });
        if (!desigRecord) throw new Error('Selected designation not found.');
        facultyUpdateData.designation = desigRecord.name;
        facultyUpdateData.designationId = desigRecord.id;
      } else if (designation) {
        facultyUpdateData.designation = designation;
      }

      // Resolve department
      if (departmentId !== undefined) {
        if (departmentId) {
          const deptRecord = await tx.department.findUnique({ where: { id: departmentId } });
          if (!deptRecord) throw new Error('Selected department not found.');
          facultyUpdateData.department = deptRecord.name;
          facultyUpdateData.departmentId = deptRecord.id;
        } else {
          facultyUpdateData.department = null;
          facultyUpdateData.departmentId = null;
        }
      } else if (department !== undefined) {
        facultyUpdateData.department = department;
      }
      if (dateOfJoining) facultyUpdateData.dateOfJoining = joiningDate;
      if (qualification !== undefined) facultyUpdateData.qualification = qualification;
      if (bankAccount !== undefined) facultyUpdateData.bankAccount = bankAccount;
      if (ifscCode !== undefined) facultyUpdateData.ifscCode = ifscCode;
      if (baseSalary !== undefined) facultyUpdateData.baseSalary = salary;
      if (isActive !== undefined) facultyUpdateData.isActive = isActive;

      const faculty = await tx.faculty.update({
        where: { id },
        data: facultyUpdateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              isActive: true
            }
          }
        }
      });

      return faculty;
    });

    return res.status(200).json({
      message: 'Faculty profile updated successfully',
      data: updatedFaculty
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle faculty active status (Activate/Deactivate)
 * @route   PATCH /api/v1/faculty/:id/toggle-status
 * @access  Private (Admin only)
 */
const toggleFacultyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const existingFaculty = await prisma.faculty.findUnique({
      where: { id }
    });

    if (!existingFaculty) {
      return res.status(404).json({
        message: 'Faculty record not found'
      });
    }

    let targetStatus = !existingFaculty.isActive;
    if (isActive !== undefined) {
      targetStatus = !!isActive;
    }

    const updatedFaculty = await prisma.$transaction(async (tx) => {
      // Update linked user isActive status
      await tx.user.update({
        where: { id: existingFaculty.userId },
        data: { isActive: targetStatus }
      });

      // Update faculty isActive status
      const faculty = await tx.faculty.update({
        where: { id },
        data: { isActive: targetStatus },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              isActive: true
            }
          }
        }
      });

      return faculty;
    });

    return res.status(200).json({
      message: `Faculty profile ${targetStatus ? 'activated' : 'deactivated'} successfully`,
      data: updatedFaculty
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get own faculty profile (for FACULTY role)
 * @route   GET /api/v1/faculty/me
 * @access  Private (FACULTY)
 */
const getMyFaculty = async (req, res, next) => {
  try {
    const faculty = await prisma.faculty.findFirst({
      where: { userId: req.user.userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true, isActive: true }
        },
        designationRecord: { select: { id: true, name: true } },
        departmentRecord: { select: { id: true, name: true } }
      }
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found for your account.' });
    }

    return res.status(200).json(faculty);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFaculty,
  getFaculty,
  getFacultyById,
  getMyFaculty,
  updateFaculty,
  toggleFacultyStatus
};
