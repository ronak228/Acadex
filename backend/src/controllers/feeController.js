const prisma = require('../db');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcNetPayable(totalAmount, discount, scholarship) {
  const total = parseFloat(totalAmount);
  let net = total;
  if (discount) {
    net -= discount.type === 'PERCENTAGE'
      ? total * parseFloat(discount.value) / 100
      : parseFloat(discount.value);
  }
  if (scholarship) {
    net -= scholarship.type === 'PERCENTAGE'
      ? total * parseFloat(scholarship.value) / 100
      : parseFloat(scholarship.value);
  }
  return parseFloat(Math.max(0, net).toFixed(2));
}

// Generates RCP-YEAR-NNNNN inside the caller's transaction context
async function nextReceiptNumber(tx) {
  const year = new Date().getFullYear();
  const prefix = `RCP-${year}-`;
  const last = await tx.feePayment.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true }
  });
  const seq = last ? parseInt(last.receiptNumber.split('-')[2], 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(5, '0')}`;
}

// ─── Fee Structures ───────────────────────────────────────────────────────────

const getFeeStructures = async (req, res, next) => {
  try {
    const { courseId, isActive } = req.query;
    const where = {};
    if (courseId) where.courseId = courseId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const structures = await prisma.feeStructure.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, code: true } },
        _count: { select: { installments: true, studentFees: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: structures });
  } catch (error) {
    next(error);
  }
};

// Accepts optional installments array; creates structure + installments atomically
const createFeeStructure = async (req, res, next) => {
  try {
    const { name, courseId, totalAmount, frequency, installments = [] } = req.body;

    if (!name || !courseId || totalAmount === undefined) {
      return res.status(400).json({ success: false, message: 'name, courseId, and totalAmount are required.' });
    }
    const total = parseFloat(totalAmount);
    if (total <= 0) {
      return res.status(400).json({ success: false, message: 'totalAmount must be positive.' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(400).json({ success: false, message: 'Course not found.' });

    if (installments.length > 0) {
      const instSum = parseFloat(
        installments.reduce((s, i) => s + parseFloat(i.amount || 0), 0).toFixed(2)
      );
      if (Math.abs(instSum - total) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Installment total (${instSum}) must equal structure total (${total}).`
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const structure = await tx.feeStructure.create({
        data: { name, courseId, totalAmount: total, frequency: frequency || 'ONE_TIME' }
      });

      if (installments.length > 0) {
        await tx.feeInstallment.createMany({
          data: installments.map((inst, idx) => ({
            feeStructureId: structure.id,
            installmentNo: inst.installmentNo ?? idx + 1,
            label: inst.label,
            amount: parseFloat(inst.amount),
            dueDate: new Date(inst.dueDate)
          }))
        });
      }

      return tx.feeStructure.findUnique({
        where: { id: structure.id },
        include: {
          course: { select: { id: true, name: true, code: true } },
          installments: { orderBy: { installmentNo: 'asc' } },
          _count: { select: { installments: true, studentFees: true } }
        }
      });
    });

    return res.status(201).json({ success: true, message: 'Fee structure created.', data: result });
  } catch (error) {
    next(error);
  }
};

const getFeeStructureById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const structure = await prisma.feeStructure.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, code: true } },
        installments: { orderBy: { installmentNo: 'asc' } }
      }
    });
    if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found.' });
    return res.status(200).json({ success: true, data: structure });
  } catch (error) {
    next(error);
  }
};

const updateFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, totalAmount, frequency, isActive } = req.body;

    const existing = await prisma.feeStructure.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Fee structure not found.' });

    const data = {};
    if (name) data.name = name;
    if (totalAmount !== undefined) {
      const parsed = parseFloat(totalAmount);
      if (parsed <= 0) return res.status(400).json({ success: false, message: 'totalAmount must be positive.' });
      const installments = await prisma.feeInstallment.findMany({ where: { feeStructureId: id }, select: { amount: true } });
      const installmentSum = parseFloat(installments.reduce((s, i) => s + parseFloat(i.amount), 0).toFixed(2));
      if (installmentSum > parsed + 0.01) {
        return res.status(400).json({
          success: false,
          message: `totalAmount (${parsed}) cannot be less than existing installment sum (${installmentSum}).`
        });
      }
      data.totalAmount = parsed;
    }
    if (frequency) data.frequency = frequency;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.feeStructure.update({ where: { id }, data });
    return res.status(200).json({ success: true, message: 'Fee structure updated.', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.feeStructure.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Fee structure not found.' });

    await prisma.feeStructure.update({ where: { id }, data: { isActive: false } });
    return res.status(200).json({ success: true, message: 'Fee structure deactivated.' });
  } catch (error) {
    next(error);
  }
};

const toggleFeeStructureStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.feeStructure.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Fee structure not found.' });

    const updated = await prisma.feeStructure.update({ where: { id }, data: { isActive: !existing.isActive } });
    return res.status(200).json({ success: true, message: `Fee structure ${updated.isActive ? 'activated' : 'deactivated'} successfully.`, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Installments ─────────────────────────────────────────────────────────────

const addInstallment = async (req, res, next) => {
  try {
    const { id: feeStructureId } = req.params;
    const { installmentNo, label, amount, dueDate } = req.body;

    if (!installmentNo || !label || amount === undefined || !dueDate) {
      return res.status(400).json({ success: false, message: 'installmentNo, label, amount, and dueDate are required.' });
    }

    const structure = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
      include: { installments: true }
    });
    if (!structure) return res.status(404).json({ success: false, message: 'Fee structure not found.' });

    const existingTotal = structure.installments.reduce((s, i) => s + parseFloat(i.amount), 0);
    const newTotal = parseFloat((existingTotal + parseFloat(amount)).toFixed(2));
    const structureTotal = parseFloat(structure.totalAmount);

    if (newTotal > structureTotal + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Installment total (${newTotal}) would exceed structure total (${structureTotal}).`
      });
    }

    const installment = await prisma.feeInstallment.create({
      data: {
        feeStructureId,
        installmentNo: parseInt(installmentNo),
        label,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate)
      }
    });

    return res.status(201).json({ success: true, message: 'Installment added.', data: installment });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'An installment with that number already exists.' });
    }
    next(error);
  }
};

const updateInstallment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, amount, dueDate } = req.body;

    const existing = await prisma.feeInstallment.findUnique({
      where: { id },
      include: { feeStructure: { include: { installments: true } } }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Installment not found.' });

    const data = {};
    if (label) data.label = label;
    if (dueDate) data.dueDate = new Date(dueDate);
    if (amount !== undefined) {
      const otherTotal = existing.feeStructure.installments
        .filter((i) => i.id !== id)
        .reduce((s, i) => s + parseFloat(i.amount), 0);
      const newTotal = parseFloat((otherTotal + parseFloat(amount)).toFixed(2));
      const structureTotal = parseFloat(existing.feeStructure.totalAmount);
      if (newTotal > structureTotal + 0.01) {
        return res.status(400).json({
          success: false,
          message: `Installment total (${newTotal}) would exceed structure total (${structureTotal}).`
        });
      }
      data.amount = parseFloat(amount);
    }

    const updated = await prisma.feeInstallment.update({ where: { id }, data });
    return res.status(200).json({ success: true, message: 'Installment updated.', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteInstallment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.feeInstallment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Installment not found.' });

    await prisma.feeInstallment.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Installment deleted.' });
  } catch (error) {
    next(error);
  }
};

// ─── Student Fee Assignment ───────────────────────────────────────────────────

const assignFee = async (req, res, next) => {
  try {
    const { studentId, feeStructureId, discountId, scholarshipId } = req.body;
    if (!studentId || !feeStructureId) {
      return res.status(400).json({ success: false, message: 'studentId and feeStructureId are required.' });
    }

    const [student, structure] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.feeStructure.findUnique({ where: { id: feeStructureId } })
    ]);
    if (!student) return res.status(400).json({ success: false, message: 'Student not found.' });
    if (!structure) return res.status(400).json({ success: false, message: 'Fee structure not found.' });
    if (!structure.isActive) return res.status(400).json({ success: false, message: 'Fee structure is inactive.' });
    if (structure.courseId !== student.courseId) {
      return res.status(400).json({ success: false, message: "Fee structure does not belong to the student's course." });
    }

    let discount = null;
    let scholarship = null;
    if (discountId) {
      discount = await prisma.discount.findUnique({ where: { id: discountId } });
      if (!discount) return res.status(400).json({ success: false, message: 'Discount not found.' });
      if (!discount.isActive) return res.status(400).json({ success: false, message: 'Discount is inactive.' });
      if (discount.courseId && discount.courseId !== student.courseId) {
        return res.status(400).json({ success: false, message: "Discount is not applicable to the student's course." });
      }
    }
    if (scholarshipId) {
      scholarship = await prisma.scholarship.findUnique({ where: { id: scholarshipId } });
      if (!scholarship) return res.status(400).json({ success: false, message: 'Scholarship not found.' });
      if (!scholarship.isActive) return res.status(400).json({ success: false, message: 'Scholarship is inactive.' });
    }

    const netPayable = calcNetPayable(structure.totalAmount, discount, scholarship);

    const studentFee = await prisma.studentFee.create({
      data: {
        studentId,
        feeStructureId,
        discountId: discountId || null,
        scholarshipId: scholarshipId || null,
        netPayable
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
        feeStructure: { select: { name: true, totalAmount: true } },
        discount: true,
        scholarship: true
      }
    });

    return res.status(201).json({ success: true, message: 'Fee assigned to student.', data: studentFee });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'This fee structure is already assigned to the student.' });
    }
    next(error);
  }
};

const getStudentFee = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Students can only access their own records
    if (req.user.role === 'STUDENT') {
      const self = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!self || self.id !== studentId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const [studentFees, studentRecord] = await Promise.all([
      prisma.studentFee.findMany({
        where: { studentId },
        include: {
          feeStructure: {
            include: { installments: { orderBy: { installmentNo: 'asc' } } }
          },
          discount: true,
          scholarship: true,
          payments: {
            include: { installment: true, collector: { select: { name: true } } },
            orderBy: { paymentDate: 'desc' }
          }
        }
      }),
      prisma.student.findUnique({ where: { id: studentId }, select: { creditBalance: true } })
    ]);

    return res.status(200).json({ success: true, data: studentFees, creditBalance: parseFloat(studentRecord?.creditBalance ?? 0) });
  } catch (error) {
    next(error);
  }
};

const applyDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { discountId } = req.body;

    const studentFee = await prisma.studentFee.findUnique({
      where: { id },
      include: { feeStructure: true, scholarship: true }
    });
    if (!studentFee) return res.status(404).json({ success: false, message: 'Student fee record not found.' });

    let discount = null;
    if (discountId) {
      discount = await prisma.discount.findUnique({ where: { id: discountId } });
      if (!discount) return res.status(400).json({ success: false, message: 'Discount not found.' });
    }

    const netPayable = calcNetPayable(studentFee.feeStructure.totalAmount, discount, studentFee.scholarship);

    const updated = await prisma.studentFee.update({
      where: { id },
      data: { discountId: discountId || null, netPayable }
    });

    return res.status(200).json({ success: true, message: 'Discount applied.', data: updated });
  } catch (error) {
    next(error);
  }
};

const applyScholarship = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scholarshipId } = req.body;

    const studentFee = await prisma.studentFee.findUnique({
      where: { id },
      include: { feeStructure: true, discount: true }
    });
    if (!studentFee) return res.status(404).json({ success: false, message: 'Student fee record not found.' });

    let scholarship = null;
    if (scholarshipId) {
      scholarship = await prisma.scholarship.findUnique({ where: { id: scholarshipId } });
      if (!scholarship) return res.status(400).json({ success: false, message: 'Scholarship not found.' });
    }

    const netPayable = calcNetPayable(studentFee.feeStructure.totalAmount, studentFee.discount, scholarship);

    const updated = await prisma.studentFee.update({
      where: { id },
      data: { scholarshipId: scholarshipId || null, netPayable }
    });

    return res.status(200).json({ success: true, message: 'Scholarship applied.', data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Fee Collection ───────────────────────────────────────────────────────────

const collectFee = async (req, res, next) => {
  try {
    const { studentFeeId, installmentId, amountPaid, paymentMethod, transactionRef, remarks, applyCredit } = req.body;

    if (!studentFeeId || amountPaid === undefined || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'studentFeeId, amountPaid, and paymentMethod are required.' });
    }
    if (parseFloat(amountPaid) < 0) {
      return res.status(400).json({ success: false, message: 'amountPaid cannot be negative.' });
    }
    if (parseFloat(amountPaid) === 0 && !applyCredit) {
      return res.status(400).json({ success: false, message: 'amountPaid must be positive.' });
    }

    const studentFee = await prisma.studentFee.findUnique({ where: { id: studentFeeId } });
    if (!studentFee) return res.status(400).json({ success: false, message: 'Student fee record not found.' });

    if (parseFloat(studentFee.netPayable) <= 0) {
      return res.status(400).json({ success: false, message: 'This fee is fully covered by discount/scholarship. No payment required.' });
    }

    // Load student + feeStructure for credit balance and discount ratio
    const [student, feeStructure] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentFee.studentId } }),
      prisma.feeStructure.findUnique({ where: { id: studentFee.feeStructureId }, select: { totalAmount: true } })
    ]);

    let installment = null;
    if (installmentId) {
      installment = await prisma.feeInstallment.findUnique({ where: { id: installmentId } });
      if (!installment) return res.status(400).json({ success: false, message: 'Installment not found.' });

      const existingPaid = await prisma.feePayment.findFirst({
        where: { studentFeeId, installmentId, status: { in: ['PAID', 'WAIVED'] } }
      });
      if (existingPaid) {
        return res.status(400).json({ success: false, message: 'This installment is already fully paid.' });
      }
    }

    const cash = parseFloat(amountPaid);
    const creditAvailable = parseFloat(student.creditBalance);

    // Target = net installment amount after discount (proportional), or total netPayable
    let target;
    if (installment) {
      const totalAmount = parseFloat(feeStructure.totalAmount) || 1;
      const discountRatio = Math.min(1, parseFloat(studentFee.netPayable) / totalAmount);
      target = parseFloat((parseFloat(installment.amount) * discountRatio).toFixed(2));
    } else {
      target = parseFloat(studentFee.netPayable);
    }

    // Subtract prior partial payments so credit application and status reflect the true remaining balance
    const priorPaymentsAgg = await prisma.feePayment.aggregate({
      where: {
        studentFeeId,
        installmentId: installmentId || null,
        status: 'PARTIALLY_PAID'
      },
      _sum: { amountPaid: true, creditApplied: true }
    });
    const priorPaid = parseFloat(priorPaymentsAgg._sum.amountPaid || 0)
      + parseFloat(priorPaymentsAgg._sum.creditApplied || 0);
    const remaining = parseFloat(Math.max(0, target - priorPaid).toFixed(2));

    // Apply credit only when admin explicitly opts in
    const creditToApply = applyCredit
      ? Math.min(creditAvailable, Math.max(0, parseFloat((remaining - cash).toFixed(2))))
      : 0;
    const effectiveTotal = parseFloat((cash + creditToApply).toFixed(2));

    // Any excess over remaining becomes new credit
    const excess = parseFloat(Math.max(0, effectiveTotal - remaining).toFixed(2));

    // Net credit balance change
    const newCreditBalance = parseFloat((creditAvailable - creditToApply + excess).toFixed(2));

    const status = effectiveTotal >= remaining ? 'PAID' : 'PARTIALLY_PAID';

    // Wrap receipt number generation + insert in a transaction so concurrent requests
    // cannot generate the same receipt number.
    const payment = await prisma.$transaction(async (tx) => {
      const receiptNumber = await nextReceiptNumber(tx);
      const p = await tx.feePayment.create({
        data: {
          studentFeeId,
          installmentId: installmentId || null,
          amountPaid: cash,
          creditApplied: creditToApply,
          paymentMethod,
          status,
          transactionRef: transactionRef || null,
          collectedBy: req.user.userId,
          receiptNumber,
          remarks: remarks || null
        },
        include: {
          studentFee: {
            include: {
              student: {
                include: {
                  user: { select: { name: true } },
                  course: { select: { name: true } }
                }
              }
            }
          },
          installment: true,
          collector: { select: { name: true } }
        }
      });

      // Update student credit balance if changed
      if (creditToApply > 0 || excess > 0) {
        await tx.student.update({
          where: { id: studentFee.studentId },
          data: { creditBalance: newCreditBalance }
        });
      }

      return p;
    });

    return res.status(201).json({ success: true, message: 'Payment recorded.', data: payment });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Receipt number conflict — please retry.' });
    }
    next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const { studentId, from, to, method, page = 1, limit = 20 } = req.query;
    const where = {};

    if (studentId) {
      where.studentFee = { studentId };
    }
    if (from || to) {
      where.paymentDate = {};
      if (from) where.paymentDate.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.paymentDate.lte = toDate;
      }
    }
    if (method) {
      const VALID_METHODS = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'UPI', 'CREDIT_ADJUSTMENT'];
      const upper = method.toUpperCase();
      if (!VALID_METHODS.includes(upper)) {
        return res.status(400).json({ success: false, message: `Invalid payment method. Must be one of: ${VALID_METHODS.join(', ')}` });
      }
      where.paymentMethod = upper;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) return res.status(400).json({ success: false, message: 'page must be a positive integer.' });
    if (isNaN(limitNum) || limitNum < 1) return res.status(400).json({ success: false, message: 'limit must be a positive integer.' });
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
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
              }
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

    return res.status(200).json({ success: true, data: payments, total, page: pageNum });
  } catch (error) {
    next(error);
  }
};

const getReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await prisma.feePayment.findUnique({
      where: { id },
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
        installment: true,
        collector: { select: { name: true } }
      }
    });

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

    // Students can only view receipts for their own payments
    if (req.user.role === 'STUDENT') {
      const self = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!self || self.id !== payment.studentFee.studentId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const receipt = {
      receiptNumber: payment.receiptNumber,
      student: {
        name: payment.studentFee.student.user.name,
        rollNumber: payment.studentFee.student.rollNumber,
        course: payment.studentFee.student.course.name
      },
      payment: {
        amountPaid: parseFloat(payment.amountPaid),
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        transactionRef: payment.transactionRef,
        status: payment.status
      },
      installment: payment.installment
        ? {
            label: payment.installment.label,
            amount: parseFloat(payment.installment.amount),
            dueDate: payment.installment.dueDate
          }
        : null,
      feeStructure: payment.studentFee.feeStructure.name,
      collectedBy: payment.collector.name,
      remarks: payment.remarks,
      issuedAt: payment.paymentDate
    };

    return res.status(200).json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};

// ─── Due Fee Tracking ─────────────────────────────────────────────────────────

const getDueFees = async (req, res, next) => {
  try {
    const today = new Date();

    // Load all student fees with their structure's overdue installments and this
    // student's own payments — avoids the N+1 query and cross-student aggregation.
    const studentFees = await prisma.studentFee.findMany({
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
        // Only load payments for this student's fee record (scoped by studentFeeId)
        payments: { select: { amountPaid: true, status: true, installmentId: true } }
      }
    });

    const overdueMap = {};

    for (const sf of studentFees) {
      for (const inst of sf.feeStructure.installments) {
        const paymentsForInst = sf.payments.filter((p) => p.installmentId === inst.id);
        const totalPaid = paymentsForInst.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
        const isWaived = paymentsForInst.some((p) => p.status === 'WAIVED');

        if (!isWaived && totalPaid < parseFloat(inst.amount) - 0.001) {
          const sid = sf.studentId;
          if (!overdueMap[sid]) {
            overdueMap[sid] = {
              ...sf.student,
              overdueInstallments: 0,
              totalAmountDue: 0
            };
          }
          overdueMap[sid].overdueInstallments += 1;
          overdueMap[sid].totalAmountDue += parseFloat(inst.amount) - totalPaid;
        }
      }
    }

    const result = Object.values(overdueMap).map((s) => ({
      ...s,
      totalAmountDue: parseFloat(s.totalAmountDue.toFixed(2))
    }));

    return res.status(200).json({ success: true, data: result, total: result.length });
  } catch (error) {
    next(error);
  }
};

const getStudentDueFees = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const today = new Date();

    // Students can only access their own records
    if (req.user.role === 'STUDENT') {
      const self = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!self || self.id !== studentId) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Load student fees with their overdue installments; use sf.payments (scoped to
    // this student) for payment checks — NOT installment.payments (all students).
    const studentFees = await prisma.studentFee.findMany({
      where: { studentId },
      include: {
        feeStructure: {
          select: {
            name: true,
            installments: {
              where: { dueDate: { lt: today } },
              orderBy: { installmentNo: 'asc' }
            }
          }
        },
        payments: { select: { amountPaid: true, status: true, installmentId: true } }
      }
    });

    const overdueItems = [];
    for (const sf of studentFees) {
      for (const inst of sf.feeStructure.installments) {
        const paymentsForInst = sf.payments.filter((p) => p.installmentId === inst.id);
        const totalPaid = paymentsForInst.reduce((s, p) => s + parseFloat(p.amountPaid), 0);
        const isWaived = paymentsForInst.some((p) => p.status === 'WAIVED');

        if (!isWaived && totalPaid < parseFloat(inst.amount) - 0.001) {
          overdueItems.push({
            studentFeeId: sf.id,
            feeStructureName: sf.feeStructure.name,
            installmentId: inst.id,
            installmentNo: inst.installmentNo,
            label: inst.label,
            amount: parseFloat(inst.amount),
            dueDate: inst.dueDate,
            amountPaid: parseFloat(totalPaid.toFixed(2)),
            amountDue: parseFloat((parseFloat(inst.amount) - totalPaid).toFixed(2))
          });
        }
      }
    }

    return res.status(200).json({ success: true, data: overdueItems });
  } catch (error) {
    next(error);
  }
};

// ─── Discounts ────────────────────────────────────────────────────────────────

const getDiscounts = async (req, res, next) => {
  try {
    const discounts = await prisma.discount.findMany({
      include: { course: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ success: true, data: discounts });
  } catch (error) {
    next(error);
  }
};

const createDiscount = async (req, res, next) => {
  try {
    const { name, type, value, courseId } = req.body;
    if (!name || !type || value === undefined) {
      return res.status(400).json({ success: false, message: 'name, type, and value are required.' });
    }
    if (parseFloat(value) < 0) {
      return res.status(400).json({ success: false, message: 'value must be non-negative.' });
    }

    const discount = await prisma.discount.create({
      data: { name, type, value: parseFloat(value), courseId: courseId || null }
    });
    return res.status(201).json({ success: true, message: 'Discount created.', data: discount });
  } catch (error) {
    next(error);
  }
};

const updateDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, value, courseId, isActive } = req.body;

    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Discount not found.' });

    const data = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (value !== undefined) data.value = parseFloat(value);
    if (courseId !== undefined) data.courseId = courseId || null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.discount.update({ where: { id }, data });
    return res.status(200).json({ success: true, message: 'Discount updated.', data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Scholarships ─────────────────────────────────────────────────────────────

const getScholarships = async (req, res, next) => {
  try {
    const scholarships = await prisma.scholarship.findMany({ orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ success: true, data: scholarships });
  } catch (error) {
    next(error);
  }
};

const createScholarship = async (req, res, next) => {
  try {
    const { name, type, value, criteria } = req.body;
    if (!name || !type || value === undefined) {
      return res.status(400).json({ success: false, message: 'name, type, and value are required.' });
    }
    if (parseFloat(value) < 0) {
      return res.status(400).json({ success: false, message: 'value must be non-negative.' });
    }

    const scholarship = await prisma.scholarship.create({
      data: { name, type, value: parseFloat(value), criteria: criteria || null }
    });
    return res.status(201).json({ success: true, message: 'Scholarship created.', data: scholarship });
  } catch (error) {
    next(error);
  }
};

const updateScholarship = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, value, criteria, isActive } = req.body;

    const existing = await prisma.scholarship.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Scholarship not found.' });

    const data = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (value !== undefined) data.value = parseFloat(value);
    if (criteria !== undefined) data.criteria = criteria || null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.scholarship.update({ where: { id }, data });
    return res.status(200).json({ success: true, message: 'Scholarship updated.', data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeeStructures,
  createFeeStructure,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  toggleFeeStructureStatus,
  addInstallment,
  updateInstallment,
  deleteInstallment,
  assignFee,
  getStudentFee,
  applyDiscount,
  applyScholarship,
  collectFee,
  getPayments,
  getReceipt,
  getDueFees,
  getStudentDueFees,
  getDiscounts,
  createDiscount,
  updateDiscount,
  getScholarships,
  createScholarship,
  updateScholarship
};
