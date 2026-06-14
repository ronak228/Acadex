const prisma = require('../db');

const VALID_TYPES = ['PDF', 'LINK', 'VIDEO', 'NOTE'];

const getMaterials = async (req, res, next) => {
  try {
    const { subjectId, batchId } = req.query;
    const where = { isActive: true };
    if (subjectId) where.subjectId = subjectId;

    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student) return res.status(403).json({ success: false, message: 'Student profile not found.' });
      where.batchId = student.batchId;
    } else if (batchId) {
      where.batchId = batchId;
    }

    const materials = await prisma.studyMaterial.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, name: true } },
        uploader: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: materials });
  } catch (error) {
    next(error);
  }
};

const createMaterial = async (req, res, next) => {
  try {
    const { title, description, type, url, subjectId, batchId } = req.body;

    if (!title || !type || !url || !subjectId) {
      return res.status(400).json({ success: false, message: 'title, type, url, and subjectId are required' });
    }
    const upperType = type.toUpperCase();
    if (!VALID_TYPES.includes(upperType)) {
      return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(400).json({ success: false, message: 'Subject not found' });

    if (batchId) {
      const batch = await prisma.batch.findUnique({ where: { id: batchId } });
      if (!batch) return res.status(400).json({ success: false, message: 'Batch not found' });
    }

    const material = await prisma.studyMaterial.create({
      data: {
        title,
        description: description || null,
        type: upperType,
        url,
        subjectId,
        batchId: batchId || null,
        uploadedBy: req.user.userId
      }
    });

    return res.status(201).json({ success: true, message: 'Study material added', data: material });
  } catch (error) {
    next(error);
  }
};

const updateMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, type, url } = req.body;

    const existing = await prisma.studyMaterial.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Material not found' });

    if (req.user.role === 'FACULTY' && existing.uploadedBy !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'You can only edit materials you uploaded' });
    }

    const data = {};
    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (type) {
      const upper = type.toUpperCase();
      if (!VALID_TYPES.includes(upper)) {
        return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
      }
      data.type = upper;
    }
    if (url) data.url = url;

    const updated = await prisma.studyMaterial.update({ where: { id }, data });
    return res.status(200).json({ success: true, message: 'Material updated', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteMaterial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.studyMaterial.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Material not found' });

    await prisma.studyMaterial.update({ where: { id }, data: { isActive: false } });
    return res.status(200).json({ success: true, message: 'Material removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMaterials, createMaterial, updateMaterial, deleteMaterial };
