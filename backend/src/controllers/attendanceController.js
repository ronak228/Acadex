const prisma = require('../db');

// Helper to normalize a date input to midnight UTC to prevent timezone/time-of-day mismatch
const normalizeToUTCDate = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * @desc    Mark or update faculty attendance (Upsert)
 * @route   POST /api/v1/attendance/faculty
 * @access  Private (Admin only)
 */
const markAttendance = async (req, res, next) => {
  try {
    const { facultyId, date, status, note, records } = req.body;

    // Check if we are receiving a bulk update array from the frontend
    if (records && Array.isArray(records)) {
      if (!date) {
        return res.status(400).json({ message: 'Missing required field: date is required.' });
      }

      const normalizedDate = normalizeToUTCDate(date);
      if (!normalizedDate) {
        return res.status(400).json({ message: 'Invalid date format.' });
      }

      // Future dates check
      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      if (normalizedDate > todayUTC) {
        return res.status(400).json({ message: 'Attendance cannot be marked for future dates.' });
      }

      const validStatuses = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'];
      const upsertPayloads = [];

      // Validate all records before database write
      for (const rec of records) {
        const { facultyId: recFacId, status: recStatus, note: recNote } = rec;
        if (!recFacId || !recStatus) {
          return res.status(400).json({ message: 'Each record must contain facultyId and status.' });
        }

        const uppercaseStatus = recStatus.toUpperCase();
        if (!validStatuses.includes(uppercaseStatus)) {
          return res.status(400).json({ message: `Invalid status: ${recStatus}. Must be PRESENT, ABSENT, HALF_DAY, or ON_LEAVE.` });
        }

        // Verify faculty exists
        const faculty = await prisma.faculty.findUnique({
          where: { id: recFacId },
          include: { user: true }
        });

        if (!faculty) {
          return res.status(404).json({ message: `Faculty member with ID ${recFacId} not found.` });
        }

        if (!faculty.isActive || !faculty.user.isActive) {
          return res.status(400).json({ message: `Cannot mark attendance for inactive faculty: ${faculty.user.name}` });
        }

        upsertPayloads.push({
          facultyId: recFacId,
          status: uppercaseStatus,
          note: recNote || null
        });
      }

      // Perform transaction
      const savedRecords = await prisma.$transaction(async (tx) => {
        const results = [];
        for (const payload of upsertPayloads) {
          const resObj = await tx.facultyAttendance.upsert({
            where: {
              facultyId_date: {
                facultyId: payload.facultyId,
                date: normalizedDate
              }
            },
            update: {
              status: payload.status,
              note: payload.note,
              markedBy: req.user.userId
            },
            create: {
              facultyId: payload.facultyId,
              date: normalizedDate,
              status: payload.status,
              note: payload.note,
              markedBy: req.user.userId
            }
          });
          results.push(resObj);
        }
        return results;
      });

      return res.status(200).json({
        message: 'Bulk attendance recorded successfully',
        data: savedRecords
      });
    }

    // --- Backwards Compatibility: Single Record ---
    if (!facultyId || !date || !status) {
      return res.status(400).json({
        message: 'Missing required fields. facultyId, date, and status are required.'
      });
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'];
    const uppercaseStatus = status.toUpperCase();
    if (!validStatuses.includes(uppercaseStatus)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const normalizedDate = normalizeToUTCDate(date);
    if (!normalizedDate) {
      return res.status(400).json({
        message: 'Invalid date format. Please provide a valid date.'
      });
    }

    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    if (normalizedDate > todayUTC) {
      return res.status(400).json({
        message: 'Attendance cannot be marked for future dates.'
      });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { user: true }
    });

    if (!faculty) {
      return res.status(404).json({
        message: 'Faculty member not found'
      });
    }

    if (!faculty.isActive || !faculty.user.isActive) {
      return res.status(400).json({
        message: 'Cannot mark attendance for an inactive faculty member'
      });
    }

    const attendance = await prisma.facultyAttendance.upsert({
      where: {
        facultyId_date: {
          facultyId,
          date: normalizedDate
        }
      },
      update: {
        status: uppercaseStatus,
        note: note !== undefined ? note : null,
        markedBy: req.user.userId
      },
      create: {
        facultyId,
        date: normalizedDate,
        status: uppercaseStatus,
        note: note || null,
        markedBy: req.user.userId
      },
      include: {
        faculty: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        marker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Attendance recorded successfully',
      data: attendance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all faculty attendance records (filterable)
 * @route   GET /api/v1/attendance/faculty
 * @access  Private (Admin, or Faculty for own only)
 */
const getAttendanceList = async (req, res, next) => {
  try {
    const { facultyId, month, year, status, startDate, endDate } = req.query;

    const where = {};

    // Access control based on user role
    if (req.user.role === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({
        where: { userId: req.user.userId }
      });

      if (!faculty) {
        return res.status(403).json({
          message: 'Access denied. No faculty profile associated with your user account.'
        });
      }

      where.facultyId = faculty.id;

      // If a faculty user requests another facultyId, restrict them
      if (facultyId && facultyId !== faculty.id) {
        return res.status(403).json({
          message: 'Access denied. You can only view your own attendance records.'
        });
      }
    } else {
      // ADMIN or SUPER_ADMIN
      if (facultyId) {
        where.facultyId = facultyId;
      }
    }

    // Status filter
    if (status) {
      const uppercaseStatus = status.toUpperCase();
      const validStatuses = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'];
      if (!validStatuses.includes(uppercaseStatus)) {
        return res.status(400).json({
          message: `Invalid status filter. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      where.status = uppercaseStatus;
    }

    // Month + Year filter or Date Range filter
    if (month && year) {
      const parsedMonth = parseInt(month, 10);
      const parsedYear = parseInt(year, 10);

      if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
        return res.status(400).json({ message: 'Invalid month filter. Must be between 1 and 12.' });
      }
      if (isNaN(parsedYear) || parsedYear <= 0) {
        return res.status(400).json({ message: 'Invalid year filter. Must be a positive integer.' });
      }

      const start = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
      const end = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59, 999));
      where.date = {
        gte: start,
        lte: end
      };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (isNaN(parsedStart.getTime())) {
          return res.status(400).json({ message: 'Invalid startDate format.' });
        }
        parsedStart.setUTCHours(0, 0, 0, 0);
        where.date.gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (isNaN(parsedEnd.getTime())) {
          return res.status(400).json({ message: 'Invalid endDate format.' });
        }
        parsedEnd.setUTCHours(23, 59, 59, 999);
        where.date.lte = parsedEnd;
      }
    }

    const list = await prisma.facultyAttendance.findMany({
      where,
      include: {
        faculty: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        marker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

/**
 * Reusable service function to calculate faculty's monthly attendance summary
 * Consumed by getMonthlySummary controller & potentially the Salary Module.
 *
 * @param {string} facultyId - UUID of the faculty member
 * @param {number|string} month - Month (1-12)
 * @param {number|string} year - Calendar Year (e.g. 2026)
 * @returns {Promise<Object>} Monthly summary calculations
 */
const getAttendanceSummaryService = async (facultyId, month, year) => {
  const parsedMonth = parseInt(month, 10);
  const parsedYear = parseInt(year, 10);

  if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw new Error('Invalid month. Must be between 1 and 12.');
  }
  if (isNaN(parsedYear) || parsedYear <= 0) {
    throw new Error('Invalid year. Must be a positive integer.');
  }

  // Ensure faculty exists
  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId }
  });
  if (!faculty) {
    throw new Error('Faculty record not found');
  }

  // Calculate start and end date for the month in UTC
  const startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
  const endDate = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59, 999));

  // Fetch all records for the faculty in the given date range
  const records = await prisma.facultyAttendance.findMany({
    where: {
      facultyId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  let present = 0;
  let absent = 0;
  let halfDay = 0;
  let onLeave = 0;

  records.forEach((record) => {
    switch (record.status) {
      case 'PRESENT':
        present++;
        break;
      case 'ABSENT':
        absent++;
        break;
      case 'HALF_DAY':
        halfDay++;
        break;
      case 'ON_LEAVE':
        onLeave++;
        break;
      default:
        break;
    }
  });

  const effectiveDays = present + (halfDay * 0.5);
  const totalDays = records.length;
  const totalCalendarDays = new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate();

  return {
    totalDays,
    totalCalendarDays,
    present,
    absent,
    halfDay,
    onLeave,
    daysPresent: present,
    daysAbsent: absent,
    halfDays: halfDay,
    leaves: onLeave,
    effectiveDays,
    records
  };
};

/**
 * @desc    Get monthly summary for a specific faculty member
 * @route   GET /api/v1/attendance/faculty/:facultyId/summary
 * @access  Private (Admin, or Faculty for own only)
 */
const getMonthlySummary = async (req, res, next) => {
  try {
    const { facultyId } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: 'Missing required query parameters: month and year are required.'
      });
    }

    // Verify faculty exists for access control check
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId }
    });

    if (!faculty) {
      return res.status(404).json({
        message: 'Faculty record not found'
      });
    }

    // Access control: FACULTY can only view their own summary
    if (req.user.role === 'FACULTY' && faculty.userId !== req.user.userId) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own attendance summary.'
      });
    }

    const summary = await getAttendanceSummaryService(facultyId, month, year);

    return res.status(200).json(summary);
  } catch (error) {
    if (error.message.startsWith('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

/**
 * @desc    Get monthly summary for all active faculty members in bulk
 * @route   GET /api/v1/attendance/faculty/summary-bulk
 * @access  Private (Admin only)
 */
const getBulkMonthlySummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: 'Missing required query parameters: month and year are required.'
      });
    }

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ message: 'Invalid month. Must be between 1 and 12.' });
    }
    if (isNaN(parsedYear) || parsedYear <= 0) {
      return res.status(400).json({ message: 'Invalid year. Must be a positive integer.' });
    }

    // 1. Fetch all active faculty
    const activeFaculty = await prisma.faculty.findMany({
      where: {
        isActive: true,
        user: {
          isActive: true
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const facultyIds = activeFaculty.map(f => f.id);

    // Calculate start and end date for the month in UTC
    const startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
    const endDate = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59, 999));

    // 2. Fetch all attendance records for these faculties in the given month range
    const allRecords = await prisma.facultyAttendance.findMany({
      where: {
        facultyId: {
          in: facultyIds
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Group records by facultyId
    const recordsByFaculty = {};
    facultyIds.forEach(id => {
      recordsByFaculty[id] = [];
    });
    allRecords.forEach(record => {
      if (recordsByFaculty[record.facultyId]) {
        recordsByFaculty[record.facultyId].push(record);
      }
    });

    // 3. Compute summary metrics for each faculty member
    const summaries = {};
    const totalCalendarDays = new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate();

    activeFaculty.forEach(fac => {
      const records = recordsByFaculty[fac.id] || [];
      let present = 0;
      let absent = 0;
      let halfDay = 0;
      let onLeave = 0;

      records.forEach((record) => {
        switch (record.status) {
          case 'PRESENT':
            present++;
            break;
          case 'ABSENT':
            absent++;
            break;
          case 'HALF_DAY':
            halfDay++;
            break;
          case 'ON_LEAVE':
            onLeave++;
            break;
          default:
            break;
        }
      });

      const effectiveDays = present + (halfDay * 0.5);
      const totalDays = records.length;

      summaries[fac.id] = {
        totalDays,
        totalCalendarDays,
        present,
        absent,
        halfDay,
        onLeave,
        daysPresent: present,
        daysAbsent: absent,
        halfDays: halfDay,
        leaves: onLeave,
        effectiveDays,
        records
      };
    });

    return res.status(200).json(summaries);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendanceList,
  getMonthlySummary,
  getBulkMonthlySummary,
  getAttendanceSummaryService
};
