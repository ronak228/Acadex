const prisma = require('../db');

// ─── Revenue Report ────────────────────────────────────────────────────────────

const getRevenueReport = async (req, res, next) => {
  try {
    const { from, to, courseId, paymentMethod, page = 1, limit = 50 } = req.query;
    const where = {};

    if (from || to) {
      where.paymentDate = {};
      if (from) where.paymentDate.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.paymentDate.lte = toDate;
      }
    }
    if (paymentMethod) {
      const VALID_METHODS = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'UPI', 'CREDIT_ADJUSTMENT'];
      const upper = paymentMethod.toUpperCase();
      if (!VALID_METHODS.includes(upper)) {
        return res.status(400).json({ success: false, message: `Invalid paymentMethod. Must be one of: ${VALID_METHODS.join(', ')}` });
      }
      where.paymentMethod = upper;
    }
    if (courseId) where.studentFee = { feeStructure: { courseId } };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) return res.status(400).json({ success: false, message: 'page must be a positive integer.' });
    if (isNaN(limitNum) || limitNum < 1) return res.status(400).json({ success: false, message: 'limit must be a positive integer.' });
    const skip = (pageNum - 1) * limitNum;

    // Fetch all for aggregations + paginated for the table
    const [allForAgg, payments, totalCount] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        select: {
          amountPaid: true,
          paymentMethod: true,
          studentFee: {
            select: { feeStructure: { select: { course: { select: { name: true } } } } }
          }
        }
      }),
      prisma.feePayment.findMany({
        where,
        include: {
          studentFee: {
            include: {
              student: {
                include: {
                  user: { select: { name: true } },
                  course: { select: { name: true } }
                }
              },
              feeStructure: { select: { name: true } }
            }
          },
          installment: { select: { label: true } },
          collector: { select: { name: true } }
        },
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.feePayment.count({ where })
    ]);

    // Aggregate totals
    const totalCollected = allForAgg.reduce((s, p) => s + parseFloat(p.amountPaid), 0);

    const byMethodMap = {};
    const byCourseMap = {};
    for (const p of allForAgg) {
      byMethodMap[p.paymentMethod] = byMethodMap[p.paymentMethod] || { amount: 0, count: 0 };
      byMethodMap[p.paymentMethod].amount += parseFloat(p.amountPaid);
      byMethodMap[p.paymentMethod].count++;

      const courseName = p.studentFee?.feeStructure?.course?.name || 'Unknown';
      byCourseMap[courseName] = (byCourseMap[courseName] || 0) + parseFloat(p.amountPaid);
    }

    return res.status(200).json({
      success: true,
      data: {
        totalCollected: parseFloat(totalCollected.toFixed(2)),
        byMethod: Object.entries(byMethodMap).map(([method, v]) => ({
          method,
          amount: parseFloat(v.amount.toFixed(2)),
          count: v.count
        })),
        byCourse: Object.entries(byCourseMap).map(([course, amount]) => ({
          course,
          amount: parseFloat(amount.toFixed(2))
        })).sort((a, b) => b.amount - a.amount),
        payments,
        total: totalCount,
        page: pageNum
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Attendance Report ─────────────────────────────────────────────────────────

const getAttendanceReport = async (req, res, next) => {
  try {
    const { batchId, from, to, studentId } = req.query;

    if (!batchId) {
      return res.status(400).json({ success: false, message: 'batchId is required.' });
    }

    if (req.user.role === 'FACULTY') {
      const faculty = await prisma.faculty.findFirst({ where: { userId: req.user.userId } });
      if (!faculty) return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
      const allowed = (await prisma.batch.findMany({ where: { facultyId: faculty.id }, select: { id: true } })).map(b => b.id);
      if (!allowed.includes(batchId)) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { course: { select: { name: true } } }
    });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    const whereAtt = { batchId };
    if (studentId) whereAtt.studentId = studentId;
    if (from || to) {
      whereAtt.date = {};
      if (from) whereAtt.date.gte = new Date(from);
      if (to) whereAtt.date.lte = new Date(to);
    }

    const records = await prisma.attendance.findMany({
      where: whereAtt,
      select: { studentId: true, date: true, status: true },
      orderBy: { date: 'asc' }
    });

    const uniqueDates = new Set(records.map(r => r.date.toISOString().split('T')[0]));
    const totalWorkingDays = uniqueDates.size;

    const studentMap = {};
    for (const r of records) {
      if (!studentMap[r.studentId]) {
        studentMap[r.studentId] = { present: 0, absent: 0, halfDay: 0, onLeave: 0, total: 0 };
      }
      studentMap[r.studentId].total++;
      if (r.status === 'PRESENT') studentMap[r.studentId].present++;
      else if (r.status === 'ABSENT') studentMap[r.studentId].absent++;
      else if (r.status === 'HALF_DAY') studentMap[r.studentId].halfDay++;
      else if (r.status === 'ON_LEAVE') studentMap[r.studentId].onLeave++;
    }

    // Fetch all active students in the batch (or just the filtered one) so
    // zero-record students appear in the report rather than being invisible.
    const students = await prisma.student.findMany({
      where: studentId ? { id: studentId, batchId } : { batchId, isActive: true },
      include: { user: { select: { name: true } } }
    });

    const report = students.map(s => {
      const att = studentMap[s.id] || { present: 0, absent: 0, halfDay: 0, onLeave: 0, total: 0 };
      const effective = att.present + att.halfDay * 0.5;
      const percentage = totalWorkingDays > 0
        ? parseFloat(((effective / totalWorkingDays) * 100).toFixed(1))
        : 0;
      return {
        studentId: s.id,
        rollNumber: s.rollNumber,
        name: s.user.name,
        present: att.present,
        absent: att.absent,
        halfDay: att.halfDay,
        onLeave: att.onLeave,
        total: att.total,
        percentage
      };
    }).sort((a, b) => b.percentage - a.percentage);

    const avgAttendance = report.length > 0
      ? parseFloat((report.reduce((s, r) => s + r.percentage, 0) / report.length).toFixed(1))
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        batch: { id: batch.id, name: batch.name, course: batch.course.name },
        totalWorkingDays,
        avgAttendance,
        students: report
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Academic Report (Syllabus Coverage) ──────────────────────────────────────

const getAcademicReport = async (req, res, next) => {
  try {
    const { courseId, subjectId, batchId } = req.query;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'courseId is required.' });
    }

    if (req.user.role === 'FACULTY' && batchId) {
      const faculty = await prisma.faculty.findFirst({ where: { userId: req.user.userId } });
      if (!faculty) return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
      const allowed = (await prisma.batch.findMany({ where: { facultyId: faculty.id }, select: { id: true } })).map(b => b.id);
      if (!allowed.includes(batchId)) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
    }

    const unitWhere = { courseId, isActive: true };
    if (subjectId) unitWhere.subjectId = subjectId;

    const units = await prisma.syllabusUnit.findMany({
      where: unitWhere,
      include: {
        subject: { select: { name: true, code: true } },
        progress: batchId
          ? {
              where: { batchId },
              include: { coveredByUser: { select: { name: true } } }
            }
          : {
              include: {
                batch: { select: { name: true } },
                coveredByUser: { select: { name: true } }
              }
            }
      },
      orderBy: [{ subjectId: 'asc' }, { unitNumber: 'asc' }]
    });

    const subjectMap = {};
    for (const unit of units) {
      const subKey = unit.subjectId;
      if (!subjectMap[subKey]) {
        subjectMap[subKey] = {
          subjectId: subKey,
          subjectName: unit.subject.name,
          subjectCode: unit.subject.code,
          totalUnits: 0,
          coveredUnits: 0,
          units: []
        };
      }
      subjectMap[subKey].totalUnits++;
      const isCovered = unit.progress.some(p => p.isCovered);
      if (isCovered) subjectMap[subKey].coveredUnits++;
      subjectMap[subKey].units.push({
        id: unit.id,
        unitNumber: unit.unitNumber,
        title: unit.title,
        description: unit.description,
        isCovered,
        progress: unit.progress
      });
    }

    const subjects = Object.values(subjectMap).map(s => ({
      ...s,
      coveragePercent: s.totalUnits > 0
        ? parseFloat(((s.coveredUnits / s.totalUnits) * 100).toFixed(1))
        : 0
    }));

    const totalUnits = subjects.reduce((s, sub) => s + sub.totalUnits, 0);
    const totalCovered = subjects.reduce((s, sub) => s + sub.coveredUnits, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalUnits,
        totalCovered,
        overallCoverage: totalUnits > 0
          ? parseFloat(((totalCovered / totalUnits) * 100).toFixed(1))
          : 0,
        subjects
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Examination Report ────────────────────────────────────────────────────────

const getExaminationReport = async (req, res, next) => {
  try {
    const { courseId, batchId, examType, from, to } = req.query;

    if (req.user.role === 'FACULTY' && batchId) {
      const faculty = await prisma.faculty.findFirst({ where: { userId: req.user.userId } });
      if (!faculty) return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
      const allowed = (await prisma.batch.findMany({ where: { facultyId: faculty.id }, select: { id: true } })).map(b => b.id);
      if (!allowed.includes(batchId)) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
    }

    const where = {};

    if (courseId) where.courseId = courseId;
    if (batchId) where.batchId = batchId;
    if (examType) {
      const upper = examType.toUpperCase();
      const validTypes = ['INTERNAL', 'EXTERNAL', 'PRACTICAL'];
      if (!validTypes.includes(upper)) {
        return res.status(400).json({ success: false, message: `Invalid examType. Must be one of: ${validTypes.join(', ')}` });
      }
      where.examType = upper;
    }
    if (from || to) {
      where.examDate = {};
      if (from) where.examDate.gte = new Date(from);
      if (to) where.examDate.lte = new Date(to);
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        course: { select: { name: true } },
        batch: { select: { name: true } },
        results: {
          include: {
            student: { include: { user: { select: { name: true } } } }
          }
        }
      },
      orderBy: { examDate: 'desc' }
    });

    const report = exams.map(exam => {
      const results = exam.results;
      const passCount = results.filter(r => r.status === 'PASS').length;
      const failCount = results.filter(r => r.status === 'FAIL').length;
      const totalStudents = results.length;
      const avgMarks = totalStudents > 0
        ? parseFloat((results.reduce((s, r) => s + parseFloat(r.marksObtained), 0) / totalStudents).toFixed(1))
        : 0;

      const sorted = [...results].sort((a, b) => parseFloat(b.marksObtained) - parseFloat(a.marksObtained));
      const top5 = sorted.slice(0, 5).map(r => ({
        name: r.student.user.name,
        marks: parseFloat(r.marksObtained),
        status: r.status
      }));
      const bottom5 = sorted.length > 5
        ? sorted.slice(-5).map(r => ({
            name: r.student.user.name,
            marks: parseFloat(r.marksObtained),
            status: r.status
          }))
        : [];

      return {
        id: exam.id,
        title: exam.title,
        examType: exam.examType,
        examDate: exam.examDate,
        course: exam.course.name,
        batch: exam.batch?.name || null,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        totalStudents,
        passCount,
        failCount,
        passRate: totalStudents > 0 ? parseFloat(((passCount / totalStudents) * 100).toFixed(1)) : 0,
        avgMarks,
        top5,
        bottom5
      };
    });

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// ─── Performance Report ────────────────────────────────────────────────────────

const getPerformanceReport = async (req, res, next) => {
  try {
    const { batchId, studentId } = req.query;
    const { role, userId } = req.user;

    let whereStudent = {};

    if (role === 'STUDENT') {
      const self = await prisma.student.findUnique({ where: { userId } });
      if (!self) return res.status(404).json({ success: false, message: 'Student record not found.' });
      whereStudent.id = self.id;
    } else if (role === 'FACULTY') {
      const faculty = await prisma.faculty.findFirst({ where: { userId } });
      if (!faculty) return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
      const facultyBatchIds = (await prisma.batch.findMany({
        where: { facultyId: faculty.id },
        select: { id: true }
      })).map(b => b.id);

      if (batchId) {
        if (!facultyBatchIds.includes(batchId)) {
          return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
        }
        whereStudent.batchId = batchId;
      } else {
        whereStudent.batchId = { in: facultyBatchIds };
      }
      if (studentId) whereStudent.id = studentId;
    } else {
      if (batchId) whereStudent.batchId = batchId;
      if (studentId) whereStudent.id = studentId;
    }

    const students = await prisma.student.findMany({
      where: whereStudent,
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { name: true, code: true } },
        batch: { select: { name: true } }
      },
      ...(role === 'STUDENT' ? { take: 1 } : {})
    });

    const report = await Promise.all(students.map(async (student) => {
      const [totalAtt, presentAtt, results, totalAssignments, submittedAssignments] = await Promise.all([
        prisma.attendance.count({ where: { studentId: student.id } }),
        prisma.attendance.count({ where: { studentId: student.id, status: 'PRESENT' } }),
        prisma.examResult.findMany({
          where: { studentId: student.id },
          include: { exam: { select: { title: true, totalMarks: true, examType: true, examDate: true } } },
          orderBy: { exam: { examDate: 'desc' } }
        }),
        student.batchId
          ? prisma.assignment.count({
              where: { batchId: student.batchId, status: { in: ['PUBLISHED', 'CLOSED'] } }
            })
          : Promise.resolve(0),
        prisma.assignmentSubmission.count({
          where: { studentId: student.id, submittedAt: { not: null } }
        })
      ]);

      const attendanceRate = totalAtt > 0
        ? parseFloat(((presentAtt / totalAtt) * 100).toFixed(1))
        : 0;
      const avgExamScore = results.length > 0
        ? parseFloat(
            (results.reduce((s, r) => s + (parseFloat(r.marksObtained) / r.exam.totalMarks) * 100, 0) / results.length).toFixed(1)
          )
        : 0;
      const assignmentCompletionRate = totalAssignments > 0
        ? parseFloat(((submittedAssignments / totalAssignments) * 100).toFixed(1))
        : 0;
      const overallRating = parseFloat(
        (attendanceRate * 0.3 + avgExamScore * 0.6 + assignmentCompletionRate * 0.1).toFixed(1)
      );

      return {
        student: {
          id: student.id,
          name: student.user.name,
          rollNumber: student.rollNumber,
          course: student.course.name,
          batch: student.batch?.name || 'N/A'
        },
        attendanceRate,
        attendancePresent: presentAtt,
        attendanceTotal: totalAtt,
        examResults: results.map(r => ({
          id: r.id,
          title: r.exam.title,
          examType: r.exam.examType,
          examDate: r.exam.examDate,
          marksObtained: parseFloat(r.marksObtained),
          totalMarks: r.exam.totalMarks,
          status: r.status
        })),
        avgExamScore,
        assignmentCompletion: {
          submitted: submittedAssignments,
          total: totalAssignments,
          rate: assignmentCompletionRate
        },
        overallRating
      };
    }));

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// ─── Conversion Report (CRM Funnel) ───────────────────────────────────────────

const getConversionReport = async (req, res, next) => {
  try {
    const { from, to, source, assignedTo } = req.query;
    const where = {};

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }
    if (source) where.source = source;
    if (assignedTo) where.assignedTo = assignedTo;

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: { assignedUser: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const funnel = { NEW: 0, CONTACTED: 0, INTERESTED: 0, CONVERTED: 0, DROPPED: 0 };
    for (const inq of inquiries) {
      funnel[inq.status] = (funnel[inq.status] || 0) + 1;
    }

    const total = inquiries.length;
    const conversionRate = total > 0
      ? parseFloat(((funnel.CONVERTED / total) * 100).toFixed(1))
      : 0;

    const staffMap = {};
    for (const inq of inquiries) {
      if (!inq.assignedUser) continue;
      const staffId = inq.assignedUser.id;
      if (!staffMap[staffId]) {
        staffMap[staffId] = { staffId, name: inq.assignedUser.name, total: 0, converted: 0, dropped: 0 };
      }
      staffMap[staffId].total++;
      if (inq.status === 'CONVERTED') staffMap[staffId].converted++;
      if (inq.status === 'DROPPED') staffMap[staffId].dropped++;
    }

    const byStaff = Object.values(staffMap).map(s => ({
      ...s,
      conversionRate: s.total > 0
        ? parseFloat(((s.converted / s.total) * 100).toFixed(1))
        : 0
    }));

    const converted = inquiries.filter(i => i.status === 'CONVERTED');
    const avgDaysToConvert = converted.length > 0
      ? parseFloat(
          (converted.reduce((s, i) => {
            const days = (new Date(i.updatedAt) - new Date(i.createdAt)) / (1000 * 60 * 60 * 24);
            return s + days;
          }, 0) / converted.length).toFixed(1)
        )
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        total,
        funnel,
        conversionRate,
        avgDaysToConvert,
        byStaff,
        inquiries: inquiries.slice(0, 100)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── Due Fee Report ────────────────────────────────────────────────────────────

const getDueFeeReport = async (req, res, next) => {
  try {
    const { courseId, batchId, overdueBy } = req.query;
    const today = new Date();

    const sfWhere = {};
    if (courseId || batchId) {
      sfWhere.student = {};
      if (courseId) sfWhere.student.courseId = courseId;
      if (batchId) sfWhere.student.batchId = batchId;
    }

    const studentFees = await prisma.studentFee.findMany({
      where: sfWhere,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            course: { select: { name: true } },
            batch: { select: { name: true } }
          }
        },
        feeStructure: {
          include: {
            installments: {
              where: { dueDate: { lt: today } },
              orderBy: { installmentNo: 'asc' }
            }
          }
        },
        payments: { select: { amountPaid: true, status: true, installmentId: true } }
      }
    });

    const overdueMap = {};

    for (const sf of studentFees) {
      for (const inst of sf.feeStructure.installments) {
        const pays = sf.payments.filter(p => p.installmentId === inst.id);
        const totalPaid = pays.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
        const isWaived = pays.some(p => p.status === 'WAIVED');

        if (isWaived || totalPaid >= parseFloat(inst.amount) - 0.001) continue;

        const daysOverdue = Math.floor((today - new Date(inst.dueDate)) / (1000 * 60 * 60 * 24));

        if (overdueBy === '0-30' && (daysOverdue < 0 || daysOverdue > 30)) continue;
        if (overdueBy === '31-60' && (daysOverdue < 31 || daysOverdue > 60)) continue;
        if (overdueBy === '60+' && daysOverdue <= 60) continue;

        const sid = sf.studentId;
        if (!overdueMap[sid]) {
          overdueMap[sid] = {
            studentId: sid,
            rollNumber: sf.student.rollNumber,
            name: sf.student.user.name,
            email: sf.student.user.email,
            phone: sf.student.user.phone,
            course: sf.student.course?.name || '',
            batch: sf.student.batch?.name || '',
            overdueInstallments: [],
            totalAmountDue: 0
          };
        }
        overdueMap[sid].overdueInstallments.push({
          installmentId: inst.id,
          label: inst.label,
          amount: parseFloat(inst.amount),
          amountPaid: parseFloat(totalPaid.toFixed(2)),
          amountDue: parseFloat((parseFloat(inst.amount) - totalPaid).toFixed(2)),
          dueDate: inst.dueDate,
          daysOverdue
        });
        overdueMap[sid].totalAmountDue += parseFloat(inst.amount) - totalPaid;
      }
    }

    const result = Object.values(overdueMap)
      .map(s => ({ ...s, totalAmountDue: parseFloat(s.totalAmountDue.toFixed(2)) }))
      .sort((a, b) => b.totalAmountDue - a.totalAmountDue);

    const totalOverdueAmount = result.reduce((s, r) => s + r.totalAmountDue, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalStudents: result.length,
        totalOverdueAmount: parseFloat(totalOverdueAmount.toFixed(2)),
        students: result
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRevenueReport,
  getAttendanceReport,
  getAcademicReport,
  getExaminationReport,
  getPerformanceReport,
  getConversionReport,
  getDueFeeReport
};
