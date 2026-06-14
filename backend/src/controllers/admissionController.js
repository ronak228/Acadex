const prisma = require('../db');
const bcrypt = require('bcryptjs');
const { generateTempPassword } = require('../utils/helpers');

/**
 * @desc    Create a new admission application
 * @route   POST /api/v1/admissions
 * @access  Private (Admin, Receptionist)
 */
const createAdmission = async (req, res, next) => {
  try {
    const { studentName, phone, email, courseId, inquiryId } = req.body;

    // Validate required fields
    if (!studentName || !phone || !courseId) {
      return res.status(400).json({
        message: 'Missing required fields. studentName, phone, and courseId are required.'
      });
    }

    // Verify course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course) {
      return res.status(400).json({ message: 'Course not found' });
    }
    if (!course.isActive) {
      return res.status(400).json({ message: 'The selected course is inactive' });
    }

    // Verify inquiry exists if provided
    if (inquiryId) {
      const inquiry = await prisma.inquiry.findUnique({
        where: { id: inquiryId }
      });
      if (!inquiry) {
        return res.status(400).json({ message: 'Linked inquiry not found' });
      }
    }

    const admission = await prisma.admission.create({
      data: {
        studentName,
        phone,
        email: email || null,
        courseId,
        inquiryId: inquiryId || null,
        status: 'APPLIED'
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        inquiry: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Admission application created successfully',
      data: admission
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all admission applications (filterable)
 * @route   GET /api/v1/admissions
 * @access  Private (Admin, Receptionist)
 */
const getAdmissions = async (req, res, next) => {
  try {
    const { status, courseId, search, startDate, endDate, dateRange } = req.query;

    const where = {};

    // Filter by status (case-insensitive enum check)
    if (status) {
      const validStatuses = ['APPLIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ENROLLED'];
      if (validStatuses.includes(status.toUpperCase())) {
        where.status = status.toUpperCase();
      }
    }

    // Filter by course
    if (courseId) {
      where.courseId = courseId;
    }

    // Search filter (studentName or phone)
    if (search) {
      const searchTrimmed = search.trim();
      where.OR = [
        { studentName: { contains: searchTrimmed, mode: 'insensitive' } },
        { phone: { contains: searchTrimmed, mode: 'insensitive' } }
      ];
    }

    // Date range filtering
    let start, end;
    if (startDate) {
      start = new Date(startDate);
    }
    if (endDate) {
      end = new Date(endDate);
    }

    if (dateRange) {
      // Expecting comma-separated format: YYYY-MM-DD,YYYY-MM-DD
      const parts = dateRange.split(',');
      if (parts.length === 2) {
        if (!start && parts[0]) start = new Date(parts[0]);
        if (!end && parts[1]) end = new Date(parts[1]);
      }
    }

    if (start || end) {
      where.appliedAt = {};
      if (start && !isNaN(start.getTime())) {
        where.appliedAt.gte = start;
      }
      if (end && !isNaN(end.getTime())) {
        // Set end of day to make the filter inclusive
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        where.appliedAt.lte = endOfDay;
      }
    }

    const admissions = await prisma.admission.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        inquiry: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        enrolledStudent: {
          select: {
            id: true,
            rollNumber: true
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    return res.status(200).json(admissions);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get admission details by ID
 * @route   GET /api/v1/admissions/:id
 * @access  Private (Admin, Receptionist)
 */
const getAdmissionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const admission = await prisma.admission.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        inquiry: {
          select: {
            id: true,
            name: true,
            phone: true,
            status: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        enrolledStudent: {
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
        }
      }
    });

    if (!admission) {
      return res.status(404).json({
        message: 'Admission record not found'
      });
    }

    return res.status(200).json(admission);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or reject admission application
 * @route   PATCH /api/v1/admissions/:id/status
 * @access  Private (Admin only)
 */
const updateAdmissionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({
        message: 'Status is required'
      });
    }

    const targetStatus = status.toUpperCase();

    // Prevent direct conversion to ENROLLED via status patch
    if (targetStatus === 'ENROLLED') {
      return res.status(400).json({
        message: 'Cannot set status to ENROLLED directly. Use the enroll endpoint instead.'
      });
    }

    const validStatuses = ['APPLIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(targetStatus)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const existingAdmission = await prisma.admission.findUnique({
      where: { id }
    });

    if (!existingAdmission) {
      return res.status(404).json({
        message: 'Admission record not found'
      });
    }

    // Once ENROLLED, record is locked
    if (existingAdmission.status === 'ENROLLED') {
      return res.status(400).json({
        message: 'Once ENROLLED, admission record is locked and cannot be modified'
      });
    }

    // Verify reviewer user exists in database to prevent foreign key constraint violations (e.g. stale JWT token after db re-seed)
    const reviewerExists = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });
    if (!reviewerExists) {
      return res.status(401).json({
        message: 'Reviewer user not found in the database. Please log out and log back in to refresh your session.'
      });
    }

    const updatedAdmission = await prisma.admission.update({
      where: { id },
      data: {
        status: targetStatus,
        remarks: remarks !== undefined ? remarks : existingAdmission.remarks,
        reviewedBy: req.user.userId
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(200).json({
      message: `Admission status updated to ${targetStatus} successfully`,
      data: updatedAdmission
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Convert APPROVED admission to active STUDENT
 * @route   POST /api/v1/admissions/:id/enroll
 * @access  Private (Admin only)
 */
const enrollAdmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      batchId,
      dateOfBirth,
      gender,
      parentName,
      parentPhone,
      address,
      email
    } = req.body;

    // Validate required fields
    if (!batchId || !dateOfBirth || !gender || !parentName || !parentPhone) {
      return res.status(400).json({
        message: 'Missing required fields. batchId, dateOfBirth, gender, parentName, and parentPhone are required.'
      });
    }

    const admission = await prisma.admission.findUnique({
      where: { id }
    });

    if (!admission) {
      return res.status(404).json({
        message: 'Admission record not found'
      });
    }

    // Business Rule: Only APPROVED admissions can be enrolled
    if (admission.status !== 'APPROVED') {
      return res.status(400).json({
        message: `Only APPROVED admissions can be enrolled. Current status is ${admission.status}`
      });
    }

    // Resolve email (use request body email or the email already stored in the admission application)
    const targetEmail = email || admission.email;
    if (!targetEmail) {
      return res.status(400).json({
        message: 'Email is required to create a user account for enrollment. Please provide it in the request body.'
      });
    }

    const cleanEmail = targetEmail.toLowerCase().trim();

    // Duplicate email check
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });
    if (existingUser) {
      return res.status(400).json({
        message: `A user with the email address ${cleanEmail} already exists`
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

    // Verify course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: admission.courseId }
    });
    if (!course) {
      return res.status(400).json({ message: 'Associated course not found' });
    }
    if (!course.isActive) {
      return res.status(400).json({ message: 'The course associated with this admission is inactive' });
    }

    // Verify batch exists, is active, and belongs to the course
    const batch = await prisma.batch.findUnique({
      where: { id: batchId }
    });
    if (!batch) {
      return res.status(400).json({ message: 'Batch not found' });
    }
    if (!batch.isActive) {
      return res.status(400).json({ message: 'The selected batch is inactive' });
    }
    if (batch.courseId !== admission.courseId) {
      return res.status(400).json({ message: 'The selected batch does not belong to the course of this admission' });
    }

    // Generate unique roll number: <COURSE_CODE>-<YEAR>-<SEQUENCE>
    const year = new Date().getFullYear();
    const prefix = `${course.code.toUpperCase()}-${year}-`;

    // Generate unique roll number with retry on concurrent collision
    let student;
    let tempPassword;
    for (let attempt = 0; attempt < 3; attempt++) {
      const lastStudent = await prisma.student.findFirst({
        where: { rollNumber: { startsWith: prefix } },
        orderBy: { enrolledAt: 'desc' }
      });
      let sequence = 1;
      if (lastStudent) {
        const parts = lastStudent.rollNumber.split('-');
        const n = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(n)) sequence = n + 1;
      }
      const rollNumber = `${prefix}${String(sequence).padStart(4, '0')}`;
      tempPassword = generateTempPassword();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      try {
        student = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              name: admission.studentName,
              email: cleanEmail,
              password: hashedPassword,
              role: 'STUDENT',
              phone: admission.phone || null,
              isActive: true,
              mustChangePassword: true
            }
          });
          const newStudent = await tx.student.create({
            data: {
              userId: user.id,
              rollNumber,
              dateOfBirth: dob,
              gender: gender.toUpperCase(),
              address: address || null,
              parentName,
              parentPhone,
              courseId: admission.courseId,
              batchId,
              isActive: true
            },
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, role: true, isActive: true } },
              course: { select: { id: true, name: true, code: true } },
              batch: { select: { id: true, name: true } }
            }
          });
          await tx.admission.update({
            where: { id },
            data: { enrolledStudentId: newStudent.id, status: 'ENROLLED' }
          });
          if (admission.inquiryId) {
            await tx.inquiry.update({
              where: { id: admission.inquiryId },
              data: { status: 'CONVERTED' }
            });
          }
          return newStudent;
        });
        break;
      } catch (err) {
        if (err.code === 'P2002' && attempt < 2) continue;
        throw err;
      }
    }

    return res.status(201).json({
      message: 'Admission application enrolled and student profile created successfully',
      data: student,
      tempPassword
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAdmission,
  getAdmissions,
  getAdmissionById,
  updateAdmissionStatus,
  enrollAdmission
};
