const prisma = require('../db');

const getDesignations = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;
    const where = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    const designations = await prisma.designation.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return res.status(200).json(designations);
  } catch (error) {
    next(error);
  }
};

const createDesignation = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Designation name is required.' });
    }

    const existing = await prisma.designation.findUnique({
      where: { name: name.trim() }
    });
    if (existing) {
      return res.status(400).json({ message: `Designation "${name.trim()}" already exists.` });
    }

    const designation = await prisma.designation.create({
      data: { name: name.trim(), description: description?.trim() || null }
    });

    return res.status(201).json({ message: 'Designation created successfully', data: designation });
  } catch (error) {
    next(error);
  }
};

const getDesignationById = async (req, res, next) => {
  try {
    const designation = await prisma.designation.findUnique({ where: { id: req.params.id } });
    if (!designation) return res.status(404).json({ message: 'Designation not found' });
    return res.status(200).json(designation);
  } catch (error) {
    next(error);
  }
};

const updateDesignation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await prisma.designation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Designation not found' });

    const data = {};
    if (name) {
      const conflict = await prisma.designation.findUnique({ where: { name: name.trim() } });
      if (conflict && conflict.id !== id) {
        return res.status(400).json({ message: `Designation "${name.trim()}" already exists.` });
      }
      data.name = name.trim();
    }
    if (description !== undefined) data.description = description?.trim() || null;

    const updated = await prisma.designation.update({ where: { id }, data });
    return res.status(200).json({ message: 'Designation updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

const toggleDesignationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.designation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Designation not found' });

    const updated = await prisma.designation.update({
      where: { id },
      data: { isActive: !existing.isActive }
    });

    return res.status(200).json({
      message: `Designation ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDesignations,
  createDesignation,
  getDesignationById,
  updateDesignation,
  toggleDesignationStatus
};
