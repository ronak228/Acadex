const prisma = require('../db');

const getDepartments = async (req, res, next) => {
  try {
    const { isActive, search } = req.query;
    const where = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { code: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    const departments = await prisma.department.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return res.status(200).json(departments);
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !name.trim() || !code || !code.trim()) {
      return res.status(400).json({ message: 'Department name and code are required.' });
    }

    const normalizedCode = code.toUpperCase().trim();

    const [nameConflict, codeConflict] = await Promise.all([
      prisma.department.findUnique({ where: { name: name.trim() } }),
      prisma.department.findUnique({ where: { code: normalizedCode } })
    ]);

    if (nameConflict) return res.status(400).json({ message: `Department "${name.trim()}" already exists.` });
    if (codeConflict) return res.status(400).json({ message: `Department code "${normalizedCode}" already exists.` });

    const department = await prisma.department.create({
      data: { name: name.trim(), code: normalizedCode, description: description?.trim() || null }
    });

    return res.status(201).json({ message: 'Department created successfully', data: department });
  } catch (error) {
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const department = await prisma.department.findUnique({ where: { id: req.params.id } });
    if (!department) return res.status(404).json({ message: 'Department not found' });
    return res.status(200).json(department);
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Department not found' });

    const data = {};

    if (name) {
      const conflict = await prisma.department.findUnique({ where: { name: name.trim() } });
      if (conflict && conflict.id !== id) {
        return res.status(400).json({ message: `Department "${name.trim()}" already exists.` });
      }
      data.name = name.trim();
    }

    if (code) {
      const normalizedCode = code.toUpperCase().trim();
      const conflict = await prisma.department.findUnique({ where: { code: normalizedCode } });
      if (conflict && conflict.id !== id) {
        return res.status(400).json({ message: `Department code "${normalizedCode}" already exists.` });
      }
      data.code = normalizedCode;
    }

    if (description !== undefined) data.description = description?.trim() || null;

    const updated = await prisma.department.update({ where: { id }, data });
    return res.status(200).json({ message: 'Department updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

const toggleDepartmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Department not found' });

    const updated = await prisma.department.update({
      where: { id },
      data: { isActive: !existing.isActive }
    });

    return res.status(200).json({
      message: `Department ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  toggleDepartmentStatus
};
