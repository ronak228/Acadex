const prisma = require('../db');

const getUnits = async (req, res, next) => {
  try {
    const { courseId, subjectId } = req.query;
    const where = { isActive: true };
    if (courseId) where.courseId = courseId;
    if (subjectId) where.subjectId = subjectId;

    const units = await prisma.syllabusUnit.findMany({
      where,
      include: {
        course: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } }
      },
      orderBy: [{ subjectId: 'asc' }, { unitNumber: 'asc' }]
    });

    return res.status(200).json({ success: true, data: units });
  } catch (error) {
    next(error);
  }
};

const createUnit = async (req, res, next) => {
  try {
    const { courseId, subjectId, unitNumber, title, description } = req.body;

    if (!courseId || !subjectId || !unitNumber || !title) {
      return res.status(400).json({ success: false, message: 'courseId, subjectId, unitNumber, and title are required' });
    }

    const [course, subject] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId } }),
      prisma.subject.findUnique({ where: { id: subjectId } })
    ]);
    if (!course) return res.status(400).json({ success: false, message: 'Course not found' });
    if (!subject) return res.status(400).json({ success: false, message: 'Subject not found' });
    if (subject.courseId !== courseId) return res.status(400).json({ success: false, message: 'Subject does not belong to this course' });

    const duplicate = await prisma.syllabusUnit.findFirst({
      where: { subjectId, unitNumber: Number(unitNumber), isActive: true }
    });
    if (duplicate) return res.status(400).json({ success: false, message: `Unit number ${unitNumber} already exists for this subject` });

    const unit = await prisma.syllabusUnit.create({
      data: { courseId, subjectId, unitNumber: Number(unitNumber), title, description: description || null }
    });

    return res.status(201).json({ success: true, message: 'Syllabus unit created', data: unit });
  } catch (error) {
    next(error);
  }
};

const updateUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, unitNumber } = req.body;

    const existing = await prisma.syllabusUnit.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Unit not found' });

    const data = {};
    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (unitNumber) data.unitNumber = Number(unitNumber);

    const updated = await prisma.syllabusUnit.update({ where: { id }, data });
    return res.status(200).json({ success: true, message: 'Unit updated', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.syllabusUnit.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Unit not found' });

    await prisma.syllabusUnit.update({ where: { id }, data: { isActive: false } });
    return res.status(200).json({ success: true, message: 'Unit removed' });
  } catch (error) {
    next(error);
  }
};

const getBatchProgress = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { subjectId } = req.query;

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student || student.batchId !== batchId) {
        return res.status(403).json({ success: false, message: 'Access denied to this batch syllabus.' });
      }
    }

    const unitWhere = { isActive: true, courseId: batch.courseId };
    if (subjectId) unitWhere.subjectId = subjectId;

    const units = await prisma.syllabusUnit.findMany({
      where: unitWhere,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        progress: { where: { batchId } }
      },
      orderBy: [{ subjectId: 'asc' }, { unitNumber: 'asc' }]
    });

    const totalUnits = units.length;
    const coveredUnits = units.filter((u) => u.progress[0]?.isCovered).length;
    const percentage = totalUnits > 0 ? Math.round((coveredUnits / totalUnits) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: { units, totalUnits, coveredUnits, percentage }
    });
  } catch (error) {
    next(error);
  }
};

const toggleUnitCoverage = async (req, res, next) => {
  try {
    const { unitId, batchId } = req.params;

    const [unit, batch] = await Promise.all([
      prisma.syllabusUnit.findUnique({ where: { id: unitId } }),
      prisma.batch.findUnique({ where: { id: batchId } })
    ]);
    if (!unit) return res.status(404).json({ success: false, message: 'Syllabus unit not found' });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const existing = await prisma.syllabusProgress.findUnique({
      where: { unitId_batchId: { unitId, batchId } }
    });

    const newCovered = existing ? !existing.isCovered : true;

    const progress = await prisma.syllabusProgress.upsert({
      where: { unitId_batchId: { unitId, batchId } },
      update: {
        isCovered: newCovered,
        coveredAt: newCovered ? new Date() : null,
        coveredBy: newCovered ? req.user.userId : null
      },
      create: {
        unitId,
        batchId,
        isCovered: true,
        coveredAt: new Date(),
        coveredBy: req.user.userId
      }
    });

    return res.status(200).json({
      success: true,
      message: `Unit marked as ${progress.isCovered ? 'covered' : 'uncovered'}`,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUnits, createUnit, updateUnit, deleteUnit, getBatchProgress, toggleUnitCoverage };
