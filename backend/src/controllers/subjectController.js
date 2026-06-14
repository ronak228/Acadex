const prisma = require('../db');

/**
 * @desc    Create a new subject
 * @route   POST /api/v1/subjects
 * @access  Private (Admin only)
 */
const createSubject = async (req, res, next) => {
  try {
    const { name, code, courseId } = req.body;

    // Validate required fields
    if (!name || !code || !courseId) {
      return res.status(400).json({
        message: 'Missing required fields. name, code, and courseId are required.'
      });
    }

    const trimmedCode = code.toUpperCase().trim();

    // Check if course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(400).json({
        message: 'Course not found'
      });
    }

    if (!course.isActive) {
      return res.status(400).json({
        message: 'The selected course is inactive. Cannot link subject to an inactive course.'
      });
    }

    // Check if subject code is unique
    const existingSubject = await prisma.subject.findUnique({
      where: { code: trimmedCode }
    });

    if (existingSubject) {
      return res.status(400).json({
        message: `A subject with code ${trimmedCode} already exists.`
      });
    }

    // Create the subject
    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        code: trimmedCode,
        courseId,
        isActive: true
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all subjects (filterable)
 * @route   GET /api/v1/subjects
 * @access  Private (Admin, Faculty, Student)
 */
const getSubjects = async (req, res, next) => {
  try {
    const { courseId, isActive, search } = req.query;

    const where = {};

    // Filter by courseId
    if (courseId) {
      where.courseId = courseId;
    }

    // Filter by isActive
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else {
      // By default, if user is not an Admin, force active subjects only.
      // Admins see active subjects by default but can request inactive ones.
      if (req.user && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        where.isActive = true;
      }
    }

    // Search filter (name or code)
    if (search) {
      const searchTrimmed = search.trim();
      where.OR = [
        { name: { contains: searchTrimmed, mode: 'insensitive' } },
        { code: { contains: searchTrimmed, mode: 'insensitive' } }
      ];
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    });

    return res.status(200).json(subjects);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get subject details by ID
 * @route   GET /api/v1/subjects/:id
 * @access  Private (Admin, Faculty, Student)
 */
const getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({
        message: 'Subject not found'
      });
    }

    return res.status(200).json(subject);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update subject details
 * @route   PUT /api/v1/subjects/:id
 * @access  Private (Admin only)
 */
const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, courseId, isActive } = req.body;

    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id }
    });

    if (!existingSubject) {
      return res.status(404).json({
        message: 'Subject not found'
      });
    }

    const updateData = {};

    if (name) {
      updateData.name = name.trim();
    }

    if (code) {
      const trimmedCode = code.toUpperCase().trim();
      if (trimmedCode !== existingSubject.code) {
        // Verify unique code
        const codeTaken = await prisma.subject.findUnique({
          where: { code: trimmedCode }
        });
        if (codeTaken) {
          return res.status(400).json({
            message: `A subject with code ${trimmedCode} already exists.`
          });
        }
        updateData.code = trimmedCode;
      }
    }

    if (courseId && courseId !== existingSubject.courseId) {
      // Check if course exists and is active
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });
      if (!course) {
        return res.status(400).json({
          message: 'Course not found'
        });
      }
      if (!course.isActive) {
        return res.status(400).json({
          message: 'The selected course is inactive. Cannot link subject to an inactive course.'
        });
      }
      updateData.courseId = courseId;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Perform update
    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Subject updated successfully',
      data: updatedSubject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete a subject (sets isActive to false)
 * @route   DELETE /api/v1/subjects/:id
 * @access  Private (Admin only)
 */
const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSubject = await prisma.subject.findUnique({
      where: { id }
    });

    if (!existingSubject) {
      return res.status(404).json({
        message: 'Subject not found'
      });
    }

    // Set isActive to false
    const deletedSubject = await prisma.subject.update({
      where: { id },
      data: { isActive: false }
    });

    return res.status(200).json({
      message: 'Subject soft-deleted successfully',
      data: deletedSubject
    });
  } catch (error) {
    next(error);
  }
};

const toggleSubjectStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const updated = await prisma.subject.update({
      where: { id },
      data: { isActive: !subject.isActive }
    });

    return res.status(200).json({
      success: true,
      message: `Subject ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  toggleSubjectStatus
};
