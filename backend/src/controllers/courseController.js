const prisma = require('../db');

/**
 * @desc    Get all courses (filterable)
 * @route   GET /api/v1/courses
 * @access  Private (Authenticated)
 */
const getCourses = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new course
 * @route   POST /api/v1/courses
 * @access  Private (Admin only)
 */
const createCourse = async (req, res, next) => {
  try {
    const { name, code, durationMonths, fees } = req.body;

    if (!name || !code || durationMonths === undefined || fees === undefined) {
      return res.status(400).json({
        message: 'Missing required fields. name, code, durationMonths, and fees are required.'
      });
    }

    const existingCourse = await prisma.course.findUnique({
      where: { code: code.toUpperCase().trim() }
    });

    if (existingCourse) {
      return res.status(400).json({
        message: `A course with code ${code} already exists`
      });
    }

    const newCourse = await prisma.course.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        durationMonths: parseInt(durationMonths, 10),
        fees: parseFloat(fees)
      }
    });

    return res.status(201).json({
      message: 'Course created successfully',
      data: newCourse
    });
  } catch (error) {
    next(error);
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: { select: { batches: true, students: true, subjects: true } }
      }
    });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    return res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, durationMonths, fees } = req.body;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Course not found' });

    const data = {};
    if (name) data.name = name;
    if (code) {
      const normalized = code.toUpperCase().trim();
      const conflict = await prisma.course.findUnique({ where: { code: normalized } });
      if (conflict && conflict.id !== id) {
        return res.status(400).json({ success: false, message: `Course code ${normalized} is already in use` });
      }
      data.code = normalized;
    }
    if (durationMonths !== undefined) data.durationMonths = parseInt(durationMonths, 10);
    if (fees !== undefined) data.fees = parseFloat(fees);

    const updated = await prisma.course.update({ where: { id }, data });
    return res.status(200).json({ success: true, message: 'Course updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

const toggleCourseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const updated = await prisma.course.update({
      where: { id },
      data: { isActive: !course.isActive }
    });

    return res.status(200).json({
      success: true,
      message: `Course ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  createCourse,
  getCourseById,
  updateCourse,
  toggleCourseStatus
};
