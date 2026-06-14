const prisma = require('../db');
const { getAttendanceSummaryService } = require('./attendanceController');

/**
 * Calculates the number of working days in a month (excluding Sundays).
 * @param {number} month - Month (1-12)
 * @param {number} year - Calendar Year (e.g. 2026)
 * @returns {number} Number of working days
 */
const getWorkingDaysInMonth = (month, year) => {
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let workingDays = 0;
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCDay() !== 0) { // 0 represents Sunday
      workingDays++;
    }
  }
  return workingDays;
};

/**
 * @desc    Generate monthly salary record
 * @route   POST /api/v1/salary/generate
 * @access  Private (Admin only)
 */
const generateSalary = async (req, res, next) => {
  try {
    const { facultyId, month, year, bonus, remarks } = req.body;

    // Validate required fields
    if (!facultyId || !month || !year) {
      return res.status(400).json({
        message: 'Missing required fields. facultyId, month, and year are required.'
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

    const bonusValue = bonus !== undefined ? parseFloat(bonus) : 0;
    if (isNaN(bonusValue) || bonusValue < 0) {
      return res.status(400).json({ message: 'Invalid bonus. Must be a non-negative number.' });
    }

    // Verify faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { user: true }
    });

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found' });
    }

    if (!faculty.isActive || !faculty.user.isActive) {
      return res.status(400).json({ message: 'Cannot generate salary for an inactive faculty member' });
    }

    // Check if record already exists
    const existingRecord = await prisma.salaryRecord.findUnique({
      where: {
        facultyId_month_year: {
          facultyId,
          month: parsedMonth,
          year: parsedYear
        }
      }
    });

    if (existingRecord) {
      return res.status(400).json({
        message: `Salary record already exists for this faculty member for ${parsedMonth}/${parsedYear}.`
      });
    }

    // Get attendance summary
    let attendanceSummary;
    try {
      attendanceSummary = await getAttendanceSummaryService(facultyId, parsedMonth, parsedYear);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const baseSalary = Number(faculty.baseSalary);
    const workingDays = getWorkingDaysInMonth(parsedMonth, parsedYear);
    if (workingDays === 0) {
      return res.status(400).json({ message: 'Working days in this month computed to 0. Cannot generate salary.' });
    }

    const perDayValue = baseSalary / workingDays;
    const absentDeduction = attendanceSummary.absent * perDayValue;
    const halfDayDeduction = attendanceSummary.halfDay * (perDayValue * 0.5);
    const totalDeductions = Number(Math.min(absentDeduction + halfDayDeduction, baseSalary).toFixed(2));
    const netSalary = Number((baseSalary - totalDeductions + bonusValue).toFixed(2));

    const salaryRecord = await prisma.salaryRecord.create({
      data: {
        facultyId,
        month: parsedMonth,
        year: parsedYear,
        baseSalary,
        deductions: totalDeductions,
        bonus: bonusValue,
        netSalary,
        remarks: remarks || null
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
        }
      }
    });

    return res.status(201).json({
      message: 'Salary record generated successfully',
      data: salaryRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk generate salary records for all active faculty
 * @route   POST /api/v1/salary/generate-bulk
 * @access  Private (Admin only)
 */
const generateBulkSalary = async (req, res, next) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        message: 'Missing required fields: month and year are required.'
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

    // Fetch all active faculty
    const activeFaculty = await prisma.faculty.findMany({
      where: {
        isActive: true,
        user: {
          isActive: true
        }
      }
    });

    const workingDays = getWorkingDaysInMonth(parsedMonth, parsedYear);
    if (workingDays === 0) {
      return res.status(400).json({ message: 'Working days in this month computed to 0. Cannot generate salary.' });
    }

    let generated = 0;
    let skipped = 0;
    const errors = [];

    for (const faculty of activeFaculty) {
      try {
        const existingRecord = await prisma.salaryRecord.findUnique({
          where: {
            facultyId_month_year: {
              facultyId: faculty.id,
              month: parsedMonth,
              year: parsedYear
            }
          }
        });

        if (existingRecord) {
          skipped++;
          continue;
        }

        const attendanceSummary = await getAttendanceSummaryService(faculty.id, parsedMonth, parsedYear);

        const baseSalary = Number(faculty.baseSalary);
        const perDayValue = baseSalary / workingDays;
        const absentDeduction = attendanceSummary.absent * perDayValue;
        const halfDayDeduction = attendanceSummary.halfDay * (perDayValue * 0.5);
        const totalDeductions = Number(Math.min(absentDeduction + halfDayDeduction, baseSalary).toFixed(2));
        const netSalary = Number((baseSalary - totalDeductions).toFixed(2));

        await prisma.salaryRecord.create({
          data: {
            facultyId: faculty.id,
            month: parsedMonth,
            year: parsedYear,
            baseSalary,
            deductions: totalDeductions,
            bonus: 0,
            netSalary,
            remarks: 'Bulk generated'
          }
        });

        generated++;
      } catch (err) {
        errors.push({
          facultyId: faculty.id,
          employeeCode: faculty.employeeCode,
          message: err.message
        });
      }
    }

    return res.status(200).json({
      message: 'Bulk salary generation complete',
      generated,
      skipped,
      errors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all salary records (filterable)
 * @route   GET /api/v1/salary
 * @access  Private (Admin only)
 */
const getSalaryRecords = async (req, res, next) => {
  try {
    const { facultyId, month, year, status } = req.query;

    const where = {};

    if (facultyId) {
      where.facultyId = facultyId;
    }

    if (month) {
      const parsedMonth = parseInt(month, 10);
      if (!isNaN(parsedMonth)) {
        where.month = parsedMonth;
      }
    }

    if (year) {
      const parsedYear = parseInt(year, 10);
      if (!isNaN(parsedYear)) {
        where.year = parsedYear;
      }
    }

    if (status) {
      const uppercaseStatus = status.toUpperCase();
      if (uppercaseStatus === 'PAID') {
        where.paidAt = { not: null };
      } else if (uppercaseStatus === 'UNPAID') {
        where.paidAt = null;
      }
    }

    const list = await prisma.salaryRecord.findMany({
      where,
      include: {
        faculty: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        payer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    return res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get salary record by ID
 * @route   GET /api/v1/salary/:id
 * @access  Private (Admin only)
 */
const getSalaryRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await prisma.salaryRecord.findUnique({
      where: { id },
      include: {
        faculty: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        payer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    return res.status(200).json(record);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an unpaid salary record (deductions, bonus, remarks)
 * @route   PUT /api/v1/salary/:id
 * @access  Private (Admin only)
 */
const updateSalaryRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deductions, bonus, remarks } = req.body;

    const record = await prisma.salaryRecord.findUnique({
      where: { id }
    });

    if (!record) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    if (record.paidAt) {
      return res.status(400).json({ message: 'Cannot update a paid salary record' });
    }

    const updateData = {};
    const baseSalary = Number(record.baseSalary);
    let currentDeductions = Number(record.deductions);
    let currentBonus = Number(record.bonus);

    if (deductions !== undefined) {
      const parsedDeductions = parseFloat(deductions);
      if (isNaN(parsedDeductions) || parsedDeductions < 0) {
        return res.status(400).json({ message: 'Deductions must be a non-negative number.' });
      }
      currentDeductions = parsedDeductions;
    }

    if (bonus !== undefined) {
      const parsedBonus = parseFloat(bonus);
      if (isNaN(parsedBonus) || parsedBonus < 0) {
        return res.status(400).json({ message: 'Bonus must be a non-negative number.' });
      }
      currentBonus = parsedBonus;
      updateData.bonus = parsedBonus;
    }

    if (remarks !== undefined) {
      updateData.remarks = remarks || null;
    }

    const cappedDeductions = Math.min(currentDeductions, baseSalary);
    updateData.deductions = cappedDeductions;
    updateData.netSalary = Number((baseSalary - cappedDeductions + currentBonus).toFixed(2));

    const updatedRecord = await prisma.salaryRecord.update({
      where: { id },
      data: updateData,
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
        }
      }
    });

    return res.status(200).json({
      message: 'Salary record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark salary record as paid
 * @route   PATCH /api/v1/salary/:id/mark-paid
 * @access  Private (Admin only)
 */
const markSalaryPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paidAt, transactionRef } = req.body;

    const record = await prisma.salaryRecord.findUnique({
      where: { id }
    });

    if (!record) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    if (record.paidAt) {
      return res.status(400).json({ message: 'Salary record is already marked as paid' });
    }

    let paidDateTime = new Date();
    if (paidAt) {
      paidDateTime = new Date(paidAt);
      if (isNaN(paidDateTime.getTime())) {
        return res.status(400).json({ message: 'Invalid paidAt date format' });
      }
    }

    let updatedRemarks = record.remarks;
    if (transactionRef) {
      updatedRemarks = record.remarks 
        ? `${record.remarks} (Bank Ref: ${transactionRef})` 
        : `Bank Ref: ${transactionRef}`;
    }

    const updatedRecord = await prisma.salaryRecord.update({
      where: { id },
      data: {
        paidAt: paidDateTime,
        paidBy: req.user.userId,
        remarks: updatedRemarks
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
        payer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Salary record marked as paid successfully',
      data: updatedRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get salary history for a specific faculty member
 * @route   GET /api/v1/salary/faculty/:facultyId
 * @access  Private (Admin, or Faculty for own only)
 */
const getFacultySalaryHistory = async (req, res, next) => {
  try {
    const { facultyId } = req.params;

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId }
    });

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty member not found' });
    }

    if (req.user.role === 'FACULTY' && faculty.userId !== req.user.userId) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own salary history.'
      });
    }

    const list = await prisma.salaryRecord.findMany({
      where: { facultyId },
      include: {
        payer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    return res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateSalary,
  generateBulkSalary,
  getSalaryRecords,
  getSalaryRecordById,
  updateSalaryRecord,
  markSalaryPaid,
  getFacultySalaryHistory
};
