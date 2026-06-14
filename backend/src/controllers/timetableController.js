const prisma = require('../db');

const VALID_DAYS = [1, 2, 3, 4, 5, 6, 7];
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const slotsOverlap = (startA, endA, startB, endB) => {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  return sA < eB && sB < eA;
};

const getTimetable = async (req, res, next) => {
  try {
    const { batchId, facultyId } = req.query;
    const where = { isActive: true };

    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student) return res.status(403).json({ success: false, message: 'Student profile not found.' });
      where.batchId = student.batchId;
    } else {
      if (batchId) where.batchId = batchId;
      if (facultyId) where.facultyId = facultyId;
    }

    const slots = await prisma.timetable.findMany({
      where,
      include: {
        batch: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        faculty: { include: { user: { select: { name: true } } } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    return res.status(200).json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

const createSlot = async (req, res, next) => {
  try {
    const { batchId, subjectId, facultyId, dayOfWeek, startTime, endTime, room } = req.body;

    if (!batchId || !subjectId || !facultyId || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'batchId, subjectId, facultyId, dayOfWeek, startTime, and endTime are required' });
    }
    if (!VALID_DAYS.includes(Number(dayOfWeek))) {
      return res.status(400).json({ success: false, message: 'dayOfWeek must be 1 (Mon) through 7 (Sun)' });
    }
    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      return res.status(400).json({ success: false, message: 'startTime and endTime must be HH:MM (24-hour)' });
    }
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({ success: false, message: 'startTime must be before endTime' });
    }

    const [batch, subject, faculty] = await Promise.all([
      prisma.batch.findUnique({ where: { id: batchId } }),
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.faculty.findUnique({ where: { id: facultyId } })
    ]);
    if (!batch) return res.status(400).json({ success: false, message: 'Batch not found' });
    if (!subject) return res.status(400).json({ success: false, message: 'Subject not found' });
    if (!subject.isActive) return res.status(400).json({ success: false, message: 'Subject is inactive' });
    if (subject.courseId !== batch.courseId) return res.status(400).json({ success: false, message: 'Subject does not belong to the batch course' });
    if (!faculty) return res.status(400).json({ success: false, message: 'Faculty not found' });
    if (!faculty.isActive) return res.status(400).json({ success: false, message: 'Faculty is inactive' });

    const existingBatchSlots = await prisma.timetable.findMany({
      where: { batchId, dayOfWeek: Number(dayOfWeek), isActive: true }
    });
    for (const slot of existingBatchSlots) {
      if (slotsOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
        return res.status(400).json({ success: false, message: 'This batch already has an overlapping slot on that day' });
      }
    }

    const existingFacultySlots = await prisma.timetable.findMany({
      where: { facultyId, dayOfWeek: Number(dayOfWeek), isActive: true }
    });
    for (const slot of existingFacultySlots) {
      if (slotsOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
        return res.status(400).json({ success: false, message: 'Faculty is already booked during that time on that day' });
      }
    }

    const created = await prisma.timetable.create({
      data: {
        batchId,
        subjectId,
        facultyId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        room: room || null
      }
    });

    return res.status(201).json({ success: true, message: 'Timetable slot created', data: created });
  } catch (error) {
    next(error);
  }
};

const updateSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subjectId, facultyId, dayOfWeek, startTime, endTime, room } = req.body;

    const existing = await prisma.timetable.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Slot not found' });

    const newDay = dayOfWeek !== undefined ? Number(dayOfWeek) : existing.dayOfWeek;
    const newStart = startTime || existing.startTime;
    const newEnd = endTime || existing.endTime;
    const newFacultyId = facultyId || existing.facultyId;

    if (!VALID_DAYS.includes(newDay)) {
      return res.status(400).json({ success: false, message: 'dayOfWeek must be 1–7' });
    }
    if (!TIME_REGEX.test(newStart) || !TIME_REGEX.test(newEnd)) {
      return res.status(400).json({ success: false, message: 'Times must be HH:MM (24-hour)' });
    }
    if (timeToMinutes(newStart) >= timeToMinutes(newEnd)) {
      return res.status(400).json({ success: false, message: 'startTime must be before endTime' });
    }

    const batchSlots = await prisma.timetable.findMany({
      where: { batchId: existing.batchId, dayOfWeek: newDay, isActive: true, NOT: { id } }
    });
    for (const slot of batchSlots) {
      if (slotsOverlap(newStart, newEnd, slot.startTime, slot.endTime)) {
        return res.status(400).json({ success: false, message: 'Overlapping slot exists for this batch' });
      }
    }

    const facultySlots = await prisma.timetable.findMany({
      where: { facultyId: newFacultyId, dayOfWeek: newDay, isActive: true, NOT: { id } }
    });
    for (const slot of facultySlots) {
      if (slotsOverlap(newStart, newEnd, slot.startTime, slot.endTime)) {
        return res.status(400).json({ success: false, message: 'Faculty is double-booked at this time' });
      }
    }

    if (subjectId) {
      const newSubject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!newSubject) return res.status(400).json({ success: false, message: 'Subject not found' });
      if (!newSubject.isActive) return res.status(400).json({ success: false, message: 'Subject is inactive' });
      const batchRecord = await prisma.batch.findUnique({ where: { id: existing.batchId }, select: { courseId: true } });
      if (newSubject.courseId !== batchRecord.courseId) return res.status(400).json({ success: false, message: 'Subject does not belong to the batch course' });
    }
    if (facultyId && facultyId !== existing.facultyId) {
      const newFaculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
      if (!newFaculty) return res.status(400).json({ success: false, message: 'Faculty not found' });
      if (!newFaculty.isActive) return res.status(400).json({ success: false, message: 'Faculty is inactive' });
    }

    const data = {};
    if (subjectId) data.subjectId = subjectId;
    if (facultyId) data.facultyId = facultyId;
    if (dayOfWeek !== undefined) data.dayOfWeek = newDay;
    if (startTime) data.startTime = startTime;
    if (endTime) data.endTime = endTime;
    if (room !== undefined) data.room = room || null;

    const updated = await prisma.timetable.update({ where: { id }, data });
    return res.status(200).json({ success: true, message: 'Slot updated', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.timetable.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Slot not found' });

    await prisma.timetable.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Slot removed' });
  } catch (error) {
    next(error);
  }
};

const getBatchTimetable = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student || student.batchId !== batchId) {
        return res.status(403).json({ success: false, message: 'Access denied to this batch timetable.' });
      }
    }

    const slots = await prisma.timetable.findMany({
      where: { batchId, isActive: true },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        faculty: { include: { user: { select: { name: true } } } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });
    return res.status(200).json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

const getFacultyTimetable = async (req, res, next) => {
  try {
    const { facultyId } = req.params;
    const slots = await prisma.timetable.findMany({
      where: { facultyId, isActive: true },
      include: {
        batch: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });
    return res.status(200).json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTimetable, createSlot, updateSlot, deleteSlot, getBatchTimetable, getFacultyTimetable };
