const prisma = require('../db');

/**
 * @desc    Get all batches (filterable by courseId)
 * @route   GET /api/v1/batches
 * @access  Private (Authenticated)
 */
const getBatches = async (req, res, next) => {
  try {
    const { courseId, isActive } = req.query;
    const where = {};

    if (courseId) {
      where.courseId = courseId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        course: {
          select: { id: true, name: true, code: true }
        },
        faculty: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    return res.status(200).json(batches);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new batch
 * @route   POST /api/v1/batches
 * @access  Private (Admin only)
 */
const createBatch = async (req, res, next) => {
  try {
    const { name, courseId, startDate, endDate, facultyId } = req.body;

    if (!name || !courseId || !startDate) {
      return res.status(400).json({
        message: 'Missing required fields. name, courseId, and startDate are required.'
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(400).json({ message: 'Course not found' });
    }

    // Parse dates
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid startDate format' });
    }

    let end = null;
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ message: 'Invalid endDate format' });
      }
      if (end <= start) {
        return res.status(400).json({ message: 'endDate must be after startDate.' });
      }
    }

    // Verify faculty exists if provided
    if (facultyId) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: facultyId }
      });
      if (!faculty) {
        return res.status(400).json({ message: 'Faculty not found' });
      }
    }

    const newBatch = await prisma.batch.create({
      data: {
        name,
        courseId,
        startDate: start,
        endDate: end,
        facultyId: facultyId || null
      }
    });

    return res.status(201).json({
      message: 'Batch created successfully',
      data: newBatch
    });
  } catch (error) {
    next(error);
  }
};

const getBatchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, code: true } },
        faculty: { include: { user: { select: { name: true, email: true } } } },
        students: {
          where: { isActive: true },
          include: { user: { select: { name: true, email: true, phone: true } } },
          orderBy: { rollNumber: 'asc' }
        }
      }
    });

    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    return res.status(200).json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
};

const updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, courseId, startDate, endDate, facultyId } = req.body;

    const existing = await prisma.batch.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Batch not found' });

    const data = {};
    if (name) data.name = name;
    if (courseId && courseId !== existing.courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return res.status(400).json({ success: false, message: 'Course not found' });
      const enrolledCount = await prisma.student.count({ where: { batchId: id } });
      if (enrolledCount > 0) {
        return res.status(400).json({ success: false, message: `Cannot change course: ${enrolledCount} student(s) are enrolled in this batch.` });
      }
      data.courseId = courseId;
    }
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return res.status(400).json({ success: false, message: 'Invalid startDate' });
      data.startDate = start;
    }
    if (endDate !== undefined) {
      if (endDate === null) {
        data.endDate = null;
      } else {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) return res.status(400).json({ success: false, message: 'Invalid endDate' });
        const effectiveStart = data.startDate || existing.startDate;
        if (end <= effectiveStart) {
          return res.status(400).json({ success: false, message: 'endDate must be after startDate.' });
        }
        data.endDate = end;
      }
    }
    if (facultyId !== undefined) {
      if (facultyId === null) {
        data.facultyId = null;
      } else {
        const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
        if (!faculty) return res.status(400).json({ success: false, message: 'Faculty not found' });
        data.facultyId = facultyId;
      }
    }

    const updated = await prisma.batch.update({ where: { id }, data });
    return res.status(200).json({ success: true, message: 'Batch updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

const toggleBatchStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const updated = await prisma.batch.update({
      where: { id },
      data: { isActive: !batch.isActive }
    });

    return res.status(200).json({
      success: true,
      message: `Batch ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const getBatchStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await prisma.batch.findUnique({ where: { id } });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const students = await prisma.student.findMany({
      where: { batchId: id },
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { rollNumber: 'asc' }
    });

    return res.status(200).json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBatches,
  createBatch,
  getBatchById,
  updateBatch,
  toggleBatchStatus,
  getBatchStudents
};
