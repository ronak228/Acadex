const prisma = require('../db');
const bcrypt = require('bcryptjs');
const { generateTempPassword } = require('../utils/helpers');

/**
 * @desc    Create a new student & user account
 * @route   POST /api/v1/students
 * @access  Private (Admin only)
 */
const createStudent = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      parentName,
      parentPhone,
      courseId,
      batchId
    } = req.body;

    // Validate required fields
    if (!name || !email || !dateOfBirth || !gender || !parentName || !parentPhone || !courseId || !batchId) {
      return res.status(400).json({
        message: 'Missing required fields. name, email, dateOfBirth, gender, parentName, parentPhone, courseId, and batchId are required.'
      });
    }

    // Validate gender format
    const validGenders = ['MALE', 'FEMALE', 'OTHER'];
    if (!validGenders.includes(gender.toUpperCase())) {
      return res.status(400).json({
        message: `Invalid gender. Must be one of: ${validGenders.join(', ')}`
      });
    }

    // Parse dateOfBirth
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({
        message: 'Invalid dateOfBirth format. Please provide a valid date.'
      });
    }
    if (dob >= new Date()) {
      return res.status(400).json({ message: 'dateOfBirth must be in the past.' });
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

    // Check if course and batch exist and are active
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course) {
      return res.status(400).json({ message: 'Course not found' });
    }
    if (!course.isActive) {
      return res.status(400).json({ message: 'The selected course is inactive' });
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId }
    });
    if (!batch) {
      return res.status(400).json({ message: 'Batch not found' });
    }
    if (!batch.isActive) {
      return res.status(400).json({ message: 'The selected batch is inactive' });
    }

    // Verify batch belongs to the course
    if (batch.courseId !== courseId) {
      return res.status(400).json({ message: 'The selected batch does not belong to the selected course' });
    }

    // Generate unique roll number: <COURSE_CODE>-<YEAR>-<SEQUENCE>
    const year = new Date().getFullYear();
    const prefix = `${course.code.toUpperCase()}-${year}-`;

    // Generate unique roll number with retry on concurrent collision
    let newStudent;
    for (let attempt = 0; attempt < 3; attempt++) {
      const lastStudent = await prisma.student.findFirst({
        where: { rollNumber: { startsWith: prefix } },
        orderBy: { createdAt: 'desc' }
      });
      let sequence = 1;
      if (lastStudent) {
        const parts = lastStudent.rollNumber.split('-');
        const n = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(n)) sequence = n + 1;
      }
      const rollNumber = `${prefix}${String(sequence).padStart(4, '0')}`;
      const tempPassword = generateTempPassword();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      try {
        newStudent = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              name,
              email: email.toLowerCase().trim(),
              password: hashedPassword,
              role: 'STUDENT',
              phone: phone || null,
              isActive: true,
              mustChangePassword: true
            }
          });
          return tx.student.create({
            data: {
              userId: user.id,
              rollNumber,
              dateOfBirth: dob,
              gender: gender.toUpperCase(),
              address: address || null,
              parentName,
              parentPhone,
              courseId,
              batchId,
              isActive: true
            },
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, role: true, isActive: true } },
              course: { select: { id: true, name: true, code: true } },
              batch: { select: { id: true, name: true } }
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
      message: 'Student and account created successfully',
      data: newStudent,
      tempPassword
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students (filterable)
 * @route   GET /api/v1/students
 * @access  Private (Admin, Faculty)
 */
const getStudents = async (req, res, next) => {
  try {
    const { courseId, batchId, isActive, search } = req.query;

    const where = {};

    if (courseId) {
      where.courseId = courseId;
    }

    if (batchId) {
      where.batchId = batchId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      const searchTrimmed = search.trim();
      where.OR = [
        { rollNumber: { contains: searchTrimmed, mode: 'insensitive' } },
        { parentName: { contains: searchTrimmed, mode: 'insensitive' } },
        { user: { name: { contains: searchTrimmed, mode: 'insensitive' } } },
        { user: { email: { contains: searchTrimmed, mode: 'insensitive' } } }
      ];
    }

    const students = await prisma.student.findMany({
      where,
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
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        batch: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        rollNumber: 'asc'
      }
    });

    return res.status(200).json(students);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student details by ID
 * @route   GET /api/v1/students/:id
 * @access  Private (Admin, Faculty, own Student)
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
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
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        batch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        message: 'Student record not found'
      });
    }

    // Access control: Student can only view their own profile
    if (req.user.role === 'STUDENT' && student.userId !== req.user.userId) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own profile.'
      });
    }

    return res.status(200).json(student);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student details
 * @route   PUT /api/v1/students/:id
 * @access  Private (Admin only)
 */
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      parentName,
      parentPhone,
      courseId,
      batchId,
      isActive
    } = req.body;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id }
    });

    if (!existingStudent) {
      return res.status(404).json({
        message: 'Student record not found'
      });
    }

    // Check if email changed and is already taken
    if (email && email.toLowerCase().trim() !== existingStudent.email) {
      const user = await prisma.user.findUnique({
        where: { id: existingStudent.userId }
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

    // Verify course & batch if they are being updated
    if (courseId && courseId !== existingStudent.courseId) {
      const courseExists = await prisma.course.findUnique({ where: { id: courseId } });
      if (!courseExists) {
        return res.status(400).json({ message: 'Course not found' });
      }
      if (!courseExists.isActive) {
        return res.status(400).json({ message: 'The selected course is inactive' });
      }
    }

    if (batchId && batchId !== existingStudent.batchId) {
      const batchExists = await prisma.batch.findUnique({ where: { id: batchId } });
      if (!batchExists) {
        return res.status(400).json({ message: 'Batch not found' });
      }
      if (!batchExists.isActive) {
        return res.status(400).json({ message: 'The selected batch is inactive' });
      }

      // Check if batch matches the target courseId
      const targetCourseId = courseId || existingStudent.courseId;
      if (batchExists.courseId !== targetCourseId) {
        return res.status(400).json({ message: 'The selected batch does not belong to the selected course' });
      }

    }

    let parsedDOB;
    if (dateOfBirth) {
      parsedDOB = new Date(dateOfBirth);
      if (isNaN(parsedDOB.getTime())) {
        return res.status(400).json({ message: 'Invalid dateOfBirth format' });
      }
      if (parsedDOB >= new Date()) {
        return res.status(400).json({ message: 'dateOfBirth must be in the past.' });
      }
    }

    if (gender) {
      const validGenders = ['MALE', 'FEMALE', 'OTHER'];
      if (!validGenders.includes(gender.toUpperCase())) {
        return res.status(400).json({
          message: `Invalid gender. Must be one of: ${validGenders.join(', ')}`
        });
      }
    }

    // Execute update in a transaction
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // 1. Update associated User fields
      const userUpdateData = {};
      if (name) userUpdateData.name = name;
      if (email) userUpdateData.email = email.toLowerCase().trim();
      if (phone !== undefined) userUpdateData.phone = phone;
      if (isActive !== undefined) userUpdateData.isActive = isActive;

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: existingStudent.userId },
          data: userUpdateData
        });
      }

      // 2. Update Student fields (rollNumber is explicitly ignored/omitted)
      const studentUpdateData = {};
      if (dateOfBirth) studentUpdateData.dateOfBirth = parsedDOB;
      if (gender) studentUpdateData.gender = gender.toUpperCase();
      if (address !== undefined) studentUpdateData.address = address;
      if (parentName) studentUpdateData.parentName = parentName;
      if (parentPhone) studentUpdateData.parentPhone = parentPhone;
      if (courseId) studentUpdateData.courseId = courseId;
      if (batchId) studentUpdateData.batchId = batchId;
      if (isActive !== undefined) studentUpdateData.isActive = isActive;

      const student = await tx.student.update({
        where: { id },
        data: studentUpdateData,
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
          },
          course: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          batch: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return student;
    });

    return res.status(200).json({
      message: 'Student updated successfully',
      data: updatedStudent
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete a student (deactivates student & linked user)
 * @route   DELETE /api/v1/students/:id
 * @access  Private (Admin only)
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return res.status(404).json({
        message: 'Student record not found'
      });
    }

    // Set isActive = false on both student and the linked user
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: student.userId },
        data: { isActive: false }
      });

      await tx.student.update({
        where: { id },
        data: { isActive: false }
      });
    });

    return res.status(200).json({
      message: 'Student account soft-deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student exam results
 * @route   GET /api/v1/students/:id/results
 * @access  Private (Admin, Faculty, own Student)
 */
const getStudentResults = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return res.status(404).json({
        message: 'Student record not found'
      });
    }

    // Access control: own STUDENT or ADMIN/FACULTY only
    if (req.user.role === 'STUDENT' && student.userId !== req.user.userId) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own exam results.'
      });
    }

    const results = await prisma.examResult.findMany({
      where: { studentId: id },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            examType: true,
            examDate: true,
            totalMarks: true,
            passingMarks: true,
            course: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: {
        exam: {
          examDate: 'desc'
        }
      }
    });

    return res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get exam results for the currently authenticated student
 * @route   GET /api/v1/students/my-results
 * @access  Private (STUDENT only)
 */
const getMyResults = async (req, res, next) => {
  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.user.userId }
    });

    if (!student) {
      return res.status(404).json({
        message: 'Student record not found for this account'
      });
    }

    const results = await prisma.examResult.findMany({
      where: { studentId: student.id },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            examType: true,
            examDate: true,
            totalMarks: true,
            passingMarks: true,
            course: {
              select: { id: true, name: true, code: true }
            }
          }
        }
      },
      orderBy: {
        exam: { examDate: 'desc' }
      }
    });

    return res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get own student profile (for STUDENT role)
 * @route   GET /api/v1/students/me
 * @access  Private (STUDENT)
 */
const getMyStudent = async (req, res, next) => {
  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.user.userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true, isActive: true }
        },
        course: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, name: true } }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found for your account.' });
    }

    return res.status(200).json(student);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  getMyStudent,
  updateStudent,
  deleteStudent,
  getStudentResults,
  getMyResults
};
