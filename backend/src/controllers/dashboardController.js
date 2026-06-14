const prisma = require('../db');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { label: MONTHS[d.getMonth()], year: d.getFullYear() };
  });
}

function groupCountByMonth(records, dateField) {
  const months = getLast6Months();
  const buckets = {};
  months.forEach(m => { buckets[`${m.year}-${m.label}`] = { month: m.label, count: 0 }; });
  for (const r of records) {
    const d = new Date(r[dateField]);
    const key = `${d.getFullYear()}-${MONTHS[d.getMonth()]}`;
    if (buckets[key]) buckets[key].count++;
  }
  return months.map(m => buckets[`${m.year}-${m.label}`]);
}

function groupSumByMonth(records, dateField, valueField) {
  const months = getLast6Months();
  const buckets = {};
  months.forEach(m => { buckets[`${m.year}-${m.label}`] = { month: m.label, amount: 0 }; });
  for (const r of records) {
    const d = new Date(r[dateField]);
    const key = `${d.getFullYear()}-${MONTHS[d.getMonth()]}`;
    if (buckets[key]) buckets[key].amount += parseFloat(r[valueField] || 0);
  }
  return months.map(m => ({
    ...buckets[`${m.year}-${m.label}`],
    amount: parseFloat(buckets[`${m.year}-${m.label}`].amount.toFixed(2))
  }));
}

async function countOverdueStudents() {
  const today = new Date();
  const studentFees = await prisma.studentFee.findMany({
    include: {
      feeStructure: {
        include: { installments: { where: { dueDate: { lt: today } } } }
      },
      payments: { select: { amountPaid: true, status: true, installmentId: true } }
    }
  });
  const overdueIds = new Set();
  for (const sf of studentFees) {
    for (const inst of sf.feeStructure.installments) {
      const pays = sf.payments.filter(p => p.installmentId === inst.id);
      const paid = pays.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
      if (!pays.some(p => p.status === 'WAIVED') && paid < parseFloat(inst.amount) - 0.001) {
        overdueIds.add(sf.studentId);
        break;
      }
    }
  }
  return overdueIds.size;
}

const getDashboard = async (req, res, next) => {
  try {
    const { role } = req.user;
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return adminDashboard(req, res, next);
    if (role === 'FACULTY') return facultyDashboard(req, res, next);
    if (role === 'STUDENT') return studentDashboard(req, res, next);
    if (role === 'RECEPTIONIST') return receptionistDashboard(req, res, next);
    return res.status(200).json({ success: true, data: { role } });
  } catch (error) {
    next(error);
  }
};

const adminDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      activeStudents,
      activeFaculty,
      newInquiriesThisMonth,
      pendingAdmissionsCount,
      revenueAgg,
      enrolledAdmissions,
      payments,
      activeBatches,
      passFailGroups,
      recentInquiries,
      pendingAdmissionList,
      upcomingExams,
    ] = await Promise.all([
      prisma.student.count({ where: { user: { isActive: true } } }),
      prisma.faculty.count({ where: { user: { isActive: true } } }),
      prisma.inquiry.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
      prisma.admission.count({ where: { status: { in: ['APPLIED', 'UNDER_REVIEW'] } } }),
      prisma.feePayment.aggregate({
        _sum: { amountPaid: true },
        where: { paymentDate: { gte: firstDayOfMonth } }
      }),
      prisma.admission.findMany({
        where: { status: 'ENROLLED', appliedAt: { gte: sixMonthsAgo } },
        select: { appliedAt: true }
      }),
      prisma.feePayment.findMany({
        where: { paymentDate: { gte: sixMonthsAgo } },
        select: { amountPaid: true, paymentDate: true }
      }),
      prisma.batch.findMany({
        where: { isActive: true },
        select: { id: true, name: true }
      }),
      prisma.examResult.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.inquiry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, courseInterest: true, status: true, createdAt: true, source: true }
      }),
      prisma.admission.findMany({
        where: { status: { in: ['APPLIED', 'UNDER_REVIEW'] } },
        take: 5,
        orderBy: { appliedAt: 'desc' },
        include: { course: { select: { name: true } } }
      }),
      prisma.exam.findMany({
        where: { examDate: { gte: now } },
        take: 5,
        orderBy: { examDate: 'asc' },
        include: {
          course: { select: { name: true } },
          batch: { select: { name: true } }
        }
      }),
    ]);

    const overdueFeesCount = await countOverdueStudents();

    // Batch attendance rates
    const batchAttendanceRates = await Promise.all(
      activeBatches.map(async (batch) => {
        const [total, present] = await Promise.all([
          prisma.attendance.count({ where: { batchId: batch.id } }),
          prisma.attendance.count({ where: { batchId: batch.id, status: 'PRESENT' } })
        ]);
        return {
          batch: batch.name,
          rate: total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0
        };
      })
    );

    const passCount = passFailGroups.find(g => g.status === 'PASS')?._count?.status || 0;
    const failCount = passFailGroups.find(g => g.status === 'FAIL')?._count?.status || 0;

    return res.status(200).json({
      success: true,
      data: {
        role: req.user.role,
        kpis: {
          totalStudents: activeStudents,
          activeStudents,
          totalFaculty: activeFaculty,
          newInquiriesThisMonth,
          pendingAdmissions: pendingAdmissionsCount,
          revenueThisMonth: parseFloat(revenueAgg._sum.amountPaid || 0),
          overdueFeesCount
        },
        charts: {
          admissionsByMonth: groupCountByMonth(enrolledAdmissions, 'appliedAt'),
          revenueByMonth: groupSumByMonth(payments, 'paymentDate', 'amountPaid'),
          attendanceRate: batchAttendanceRates,
          passFailRatio: { pass: passCount, fail: failCount }
        },
        recentActivity: {
          recentInquiries,
          pendingAdmissions: pendingAdmissionList,
          upcomingExams
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const facultyDashboard = async (req, res, next) => {
  try {
    const faculty = await prisma.faculty.findUnique({ where: { userId: req.user.userId } });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty record not found.' });

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const batches = await prisma.batch.findMany({
      where: { facultyId: faculty.id, isActive: true },
      include: {
        course: { select: { name: true, code: true } },
        _count: { select: { students: true } }
      }
    });
    const batchIds = batches.map(b => b.id);

    const [presentDays, totalDays, upcomingExams, recentAssignments] = await Promise.all([
      prisma.facultyAttendance.count({
        where: { facultyId: faculty.id, date: { gte: firstDayOfMonth }, status: 'PRESENT' }
      }),
      prisma.facultyAttendance.count({
        where: { facultyId: faculty.id, date: { gte: firstDayOfMonth } }
      }),
      prisma.exam.findMany({
        where: { batchId: { in: batchIds }, examDate: { gte: now } },
        take: 5,
        orderBy: { examDate: 'asc' },
        include: {
          course: { select: { name: true } },
          batch: { select: { name: true } }
        }
      }),
      batchIds.length > 0
        ? prisma.assignment.findMany({
            where: {
              batchId: { in: batchIds },
              status: { in: ['PUBLISHED', 'CLOSED'] },
              dueDate: { gte: thirtyDaysAgo }
            },
            take: 5,
            orderBy: { dueDate: 'desc' },
            include: {
              subject: { select: { name: true } },
              batch: { select: { name: true } },
              _count: { select: { submissions: true } }
            }
          })
        : Promise.resolve([])
    ]);

    return res.status(200).json({
      success: true,
      data: {
        role: req.user.role,
        kpis: {
          assignedBatches: batches.length,
          attendancePresent: presentDays,
          attendanceTotal: totalDays,
          upcomingExamsCount: upcomingExams.length
        },
        batches,
        upcomingExams,
        recentAssignments
      }
    });
  } catch (error) {
    next(error);
  }
};

const studentDashboard = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
      include: {
        course: { select: { name: true, code: true } },
        batch: { select: { name: true, startDate: true, endDate: true } }
      }
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found.' });

    const now = new Date();

    const [totalAttendance, presentCount, halfDayCount, completedExams, latestResults] = await Promise.all([
      prisma.attendance.count({ where: { studentId: student.id } }),
      prisma.attendance.count({ where: { studentId: student.id, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { studentId: student.id, status: 'HALF_DAY' } }),
      prisma.examResult.count({ where: { studentId: student.id } }),
      prisma.examResult.findMany({
        where: { studentId: student.id },
        take: 5,
        orderBy: { exam: { examDate: 'desc' } },
        include: {
          exam: { select: { title: true, totalMarks: true, examType: true, examDate: true } }
        }
      })
    ]);

    const pendingAssignments = student.batchId
      ? await prisma.assignment.findMany({
          where: {
            batchId: student.batchId,
            status: 'PUBLISHED',
            dueDate: { gte: now },
            submissions: { none: { studentId: student.id } }
          },
          take: 5,
          orderBy: { dueDate: 'asc' },
          include: { subject: { select: { name: true } } }
        })
      : [];

    return res.status(200).json({
      success: true,
      data: {
        role: req.user.role,
        kpis: {
          enrolledBatch: student.batch?.name || 'Not assigned',
          course: student.course?.name || 'Not enrolled',
          attendanceRate: totalAttendance > 0
            ? parseFloat((((presentCount + halfDayCount * 0.5) / totalAttendance) * 100).toFixed(1))
            : 0,
          attendancePresent: presentCount,
          attendanceTotal: totalAttendance,
          completedExams
        },
        latestResults,
        pendingAssignments
      }
    });
  } catch (error) {
    next(error);
  }
};

const receptionistDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const [
      todayInquiries,
      pendingAdmissions,
      followUpsDueToday,
      recentInquiries,
      pendingAdmissionList,
      followUps
    ] = await Promise.all([
      prisma.inquiry.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.admission.count({ where: { status: { in: ['APPLIED', 'UNDER_REVIEW'] } } }),
      prisma.inquiry.count({
        where: {
          followUpDate: { gte: startOfDay, lte: endOfDay },
          status: { notIn: ['CONVERTED', 'DROPPED'] }
        }
      }),
      prisma.inquiry.findMany({
        where: { createdAt: { gte: startOfDay } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, phone: true, courseInterest: true, status: true, createdAt: true }
      }),
      prisma.admission.findMany({
        where: { status: { in: ['APPLIED', 'UNDER_REVIEW'] } },
        take: 10,
        orderBy: { appliedAt: 'desc' },
        include: { course: { select: { name: true } } }
      }),
      prisma.inquiry.findMany({
        where: {
          followUpDate: { gte: startOfDay, lte: endOfDay },
          status: { notIn: ['CONVERTED', 'DROPPED'] }
        },
        include: { assignedUser: { select: { name: true } } }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        role: req.user.role,
        kpis: { todayInquiries, pendingAdmissions, followUpsDueToday },
        recentActivity: { recentInquiries, pendingAdmissions: pendingAdmissionList, followUps }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
