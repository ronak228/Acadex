const prisma = require('../db');

const getAssignments = async (req, res, next) => {
  try {
    const { batchId, status } = req.query;
    const where = {};

    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student) return res.status(403).json({ success: false, message: 'Student profile not found.' });
      where.batchId = student.batchId;
      where.status = 'PUBLISHED';
    } else {
      if (batchId) where.batchId = batchId;
      if (status) {
        const upper = status.toUpperCase();
        const validStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED'];
        if (!validStatuses.includes(upper)) {
          return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        where.status = upper;
      }
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        batch: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        creator: { select: { name: true } },
        _count: { select: { submissions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const { title, description, batchId, subjectId, dueDate, maxMarks } = req.body;

    if (!title || !batchId || !subjectId || !dueDate) {
      return res.status(400).json({ success: false, message: 'title, batchId, subjectId, and dueDate are required' });
    }

    const [batch, subject] = await Promise.all([
      prisma.batch.findUnique({ where: { id: batchId } }),
      prisma.subject.findUnique({ where: { id: subjectId } })
    ]);
    if (!batch) return res.status(400).json({ success: false, message: 'Batch not found' });
    if (!subject) return res.status(400).json({ success: false, message: 'Subject not found' });

    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return res.status(400).json({ success: false, message: 'Invalid dueDate format' });

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || null,
        batchId,
        subjectId,
        createdBy: req.user.userId,
        dueDate: due,
        maxMarks: maxMarks ? Number(maxMarks) : 100
      }
    });

    return res.status(201).json({ success: true, message: 'Assignment created', data: assignment });
  } catch (error) {
    next(error);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, maxMarks } = req.body;

    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Assignment not found' });
    if (existing.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Closed assignments cannot be edited' });
    }

    const data = {};
    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (dueDate) {
      const due = new Date(dueDate);
      if (isNaN(due.getTime())) return res.status(400).json({ success: false, message: 'Invalid dueDate format' });
      data.dueDate = due;
    }
    if (maxMarks) data.maxMarks = Number(maxMarks);

    const updated = await prisma.assignment.update({ where: { id }, data });
    return res.status(200).json({ success: true, message: 'Assignment updated', data: updated });
  } catch (error) {
    next(error);
  }
};

const publishAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Assignment not found' });
    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ success: false, message: 'Only DRAFT assignments can be published' });
    }

    const batchStudents = await prisma.student.findMany({ where: { batchId: existing.batchId } });

    await prisma.$transaction(async (tx) => {
      await tx.assignment.update({ where: { id }, data: { status: 'PUBLISHED' } });
      for (const s of batchStudents) {
        await tx.assignmentSubmission.upsert({
          where: { assignmentId_studentId: { assignmentId: id, studentId: s.id } },
          update: {},
          create: { assignmentId: id, studentId: s.id }
        });
      }
    });

    return res.status(200).json({ success: true, message: 'Assignment published and distributed to all batch students' });
  } catch (error) {
    next(error);
  }
};

const closeAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Assignment not found' });
    if (existing.status !== 'PUBLISHED') {
      return res.status(400).json({ success: false, message: 'Only PUBLISHED assignments can be closed' });
    }

    const updated = await prisma.assignment.update({ where: { id }, data: { status: 'CLOSED' } });
    return res.status(200).json({ success: true, message: 'Assignment closed. Grading is now open.', data: updated });
  } catch (error) {
    next(error);
  }
};

const getSubmissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: id },
      include: {
        student: { include: { user: { select: { name: true } } } },
        grader: { select: { name: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
};

const submitAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
    if (!student) return res.status(403).json({ success: false, message: 'Student profile not found' });

    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    if (assignment.batchId !== student.batchId) {
      return res.status(403).json({ success: false, message: 'This assignment does not belong to your batch.' });
    }
    if (assignment.status !== 'PUBLISHED') {
      return res.status(400).json({ success: false, message: 'This assignment is not open for submissions' });
    }

    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId: id, studentId: student.id } },
      update: { submittedAt: new Date() },
      create: { assignmentId: id, studentId: student.id, submittedAt: new Date() }
    });

    return res.status(200).json({ success: true, message: 'Assignment submitted', data: submission });
  } catch (error) {
    next(error);
  }
};

const gradeSubmission = async (req, res, next) => {
  try {
    const { id: assignmentId, studentId } = req.params;
    const { marksAwarded, feedback } = req.body;

    if (marksAwarded === undefined) {
      return res.status(400).json({ success: false, message: 'marksAwarded is required' });
    }

    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    if (assignment.status !== 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Grading is only allowed after assignment is CLOSED' });
    }
    if (Number(marksAwarded) > assignment.maxMarks) {
      return res.status(400).json({ success: false, message: `marksAwarded cannot exceed maxMarks (${assignment.maxMarks})` });
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } }
    });
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

    const updated = await prisma.assignmentSubmission.update({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      data: { marksAwarded: Number(marksAwarded), feedback: feedback || null, gradedBy: req.user.userId }
    });

    return res.status(200).json({ success: true, message: 'Submission graded', data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAssignments, createAssignment, updateAssignment, publishAssignment, closeAssignment, getSubmissions, submitAssignment, gradeSubmission };
