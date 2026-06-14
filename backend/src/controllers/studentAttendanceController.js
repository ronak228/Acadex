const prisma = require('../db');

const VALID_STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'];

const toUTCDate = (input) => {
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { batchId, date, records } = req.body;

    if (!batchId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'batchId, date, and records[] are required' });
    }

    const normalizedDate = toUTCDate(date);
    if (!normalizedDate) return res.status(400).json({ success: false, message: 'Invalid date format' });

    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    if (normalizedDate > todayUTC) {
      return res.status(400).json({ success: false, message: 'Cannot mark attendance for future dates' });
    }

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    if (req.user.role === 'FACULTY') {
      const faculty = await prisma.faculty.findFirst({ where: { userId: req.user.userId } });
      if (!faculty) return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
      if (batch.facultyId !== faculty.id) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
    }

    const batchStudents = await prisma.student.findMany({
      where: { batchId, isActive: true },
      select: { id: true }
    });
    const validStudentIds = new Set(batchStudents.map(s => s.id));

    const payloads = [];
    for (const rec of records) {
      const { studentId, status, note } = rec;
      if (!studentId || !status) {
        return res.status(400).json({ success: false, message: 'Each record must have studentId and status' });
      }
      if (!validStudentIds.has(studentId)) {
        return res.status(400).json({ success: false, message: `Student ${studentId} is not an active member of this batch.` });
      }
      const upper = status.toUpperCase();
      if (!VALID_STATUSES.includes(upper)) {
        return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
      }
      payloads.push({ studentId, status: upper, note: note || null });
    }

    const saved = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const p of payloads) {
        const r = await tx.attendance.upsert({
          where: { studentId_batchId_date: { studentId: p.studentId, batchId, date: normalizedDate } },
          update: { status: p.status, note: p.note, markedBy: req.user.userId },
          create: { studentId: p.studentId, batchId, date: normalizedDate, status: p.status, note: p.note, markedBy: req.user.userId }
        });
        results.push(r);
      }
      return results;
    });

    return res.status(200).json({ success: true, message: 'Attendance marked successfully', data: saved });
  } catch (error) {
    next(error);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const { batchId, date } = req.query;
    const where = {};
    if (batchId) where.batchId = batchId;
    if (date) {
      const d = toUTCDate(date);
      if (!d) return res.status(400).json({ success: false, message: 'Invalid date format' });
      where.date = d;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true } } } },
        marker: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student || student.id !== studentId) {
        return res.status(403).json({ success: false, message: 'Access denied. Students can only view their own records.' });
      }
    }

    const records = await prisma.attendance.findMany({
      where: { studentId },
      include: { batch: { select: { name: true } } },
      orderBy: { date: 'desc' }
    });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const getAttendanceSummary = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const students = await prisma.student.findMany({
      where: { batchId },
      include: { user: { select: { name: true } } }
    });

    const allRecords = await prisma.attendance.findMany({ where: { batchId } });

    const uniqueDates = [...new Set(allRecords.map((r) => r.date.toISOString()))];
    const totalDays = uniqueDates.length;

    const summary = students.map((s) => {
      const records = allRecords.filter((r) => r.studentId === s.id);
      const present = records.filter((r) => r.status === 'PRESENT').length;
      const halfDay = records.filter((r) => r.status === 'HALF_DAY').length;
      const absent = records.filter((r) => r.status === 'ABSENT').length;
      const onLeave = records.filter((r) => r.status === 'ON_LEAVE').length;
      const effective = present + halfDay * 0.5;
      const percentage = totalDays > 0 ? Math.round((effective / totalDays) * 100) : 0;

      return {
        studentId: s.id,
        rollNumber: s.rollNumber,
        name: s.user.name,
        present,
        halfDay,
        absent,
        onLeave,
        totalDays,
        effectiveDays: effective,
        percentage
      };
    });

    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

const correctAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) return res.status(400).json({ success: false, message: 'status is required' });
    const upper = status.toUpperCase();
    if (!VALID_STATUSES.includes(upper)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Attendance record not found' });

    const updated = await prisma.attendance.update({
      where: { id },
      data: { status: upper, note: note !== undefined ? note : existing.note, markedBy: req.user.userId }
    });

    return res.status(200).json({ success: true, message: 'Attendance corrected', data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { bulkMarkAttendance, getAttendance, getStudentAttendance, getAttendanceSummary, correctAttendance };
