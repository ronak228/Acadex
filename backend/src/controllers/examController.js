const prisma = require('../db');

/**
 * @desc    Create a new exam
 * @route   POST /api/v1/exams
 * @access  Private (Admin, Faculty only)
 */
const createExam = async (req, res, next) => {
  try {
    const { title, courseId, batchId, examType, examDate, totalMarks, passingMarks, questionIds } = req.body;

    // Validate required fields
    if (!title || !courseId || !examType || !examDate || totalMarks === undefined || passingMarks === undefined) {
      return res.status(400).json({
        message: 'Missing required fields. title, courseId, examType, examDate, totalMarks, and passingMarks are required.'
      });
    }

    // Validate marks values
    const parsedTotalMarks = parseInt(totalMarks, 10);
    const parsedPassingMarks = parseInt(passingMarks, 10);

    if (isNaN(parsedTotalMarks) || parsedTotalMarks <= 0) {
      return res.status(400).json({
        message: 'totalMarks must be a positive integer'
      });
    }

    if (isNaN(parsedPassingMarks) || parsedPassingMarks <= 0) {
      return res.status(400).json({
        message: 'passingMarks must be a positive integer'
      });
    }

    if (parsedPassingMarks > parsedTotalMarks) {
      return res.status(400).json({
        message: 'passingMarks cannot be greater than totalMarks'
      });
    }

    // Validate course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(400).json({
        message: 'Course not found'
      });
    }

    if (!course.isActive) {
      return res.status(400).json({
        message: 'The selected course is inactive. Cannot create exams for inactive courses.'
      });
    }

    // Validate batch if provided
    if (batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId }
      });

      if (!batch) {
        return res.status(400).json({
          message: 'Batch not found'
        });
      }

      if (!batch.isActive) {
        return res.status(400).json({
          message: 'The selected batch is inactive. Cannot schedule exams for inactive batches.'
        });
      }

      if (batch.courseId !== courseId) {
        return res.status(400).json({
          message: 'The selected batch does not belong to the selected course.'
        });
      }
    }

    // Validate examType
    const upperExamType = examType.toUpperCase().trim();
    const validExamTypes = ['INTERNAL', 'EXTERNAL', 'PRACTICAL'];
    if (!validExamTypes.includes(upperExamType)) {
      return res.status(400).json({
        message: `Invalid examType. Must be one of: ${validExamTypes.join(', ')}`
      });
    }

    // Parse and validate date
    const parsedDate = new Date(examDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: 'Invalid examDate format. Please use a valid date string (e.g., YYYY-MM-DD).'
      });
    }

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        title: title.trim(),
        courseId,
        batchId: batchId || null,
        examType: upperExamType,
        examDate: parsedDate,
        totalMarks: parsedTotalMarks,
        passingMarks: parsedPassingMarks,
        createdBy: req.user.userId
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    // Link questions if provided
    if (Array.isArray(questionIds) && questionIds.length > 0) {
      await prisma.examQuestion.createMany({
        data: questionIds.map((qId) => ({ examId: exam.id, questionId: qId })),
        skipDuplicates: true
      });
    }

    return res.status(201).json({
      message: 'Exam created successfully',
      data: exam
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all exams (filterable)
 * @route   GET /api/v1/exams
 * @access  Private (Admin, Faculty, Student)
 */
const getExams = async (req, res, next) => {
  try {
    const { courseId, batchId, examType, examDate, fromDate, toDate } = req.query;

    const where = {};

    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student) return res.status(403).json({ message: 'Student profile not found.' });
      where.batchId = student.batchId;
    } else {
      if (courseId) where.courseId = courseId;
      if (batchId) where.batchId = batchId;
    }

    if (examType) {
      const upperExamType = examType.toUpperCase().trim();
      const validExamTypes = ['INTERNAL', 'EXTERNAL', 'PRACTICAL'];
      if (validExamTypes.includes(upperExamType)) {
        where.examType = upperExamType;
      }
    }

    if (fromDate || toDate) {
      where.examDate = {};
      if (fromDate) {
        const d = new Date(fromDate);
        if (!isNaN(d.getTime())) where.examDate.gte = d;
      }
      if (toDate) {
        const d = new Date(toDate);
        if (!isNaN(d.getTime())) where.examDate.lte = d;
      }
    } else if (examDate) {
      const parsedDate = new Date(examDate);
      if (!isNaN(parsedDate.getTime())) {
        where.examDate = parsedDate;
      }
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        course: {
          select: { id: true, name: true, code: true }
        },
        batch: {
          select: { id: true, name: true }
        },
        creator: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: {
        examDate: 'desc'
      }
    });

    return res.status(200).json(exams);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get exam details by ID
 * @route   GET /api/v1/exams/:id
 * @access  Private (Admin, Faculty, Student)
 */
const getExamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isStudent = req.user.role === 'STUDENT';

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, code: true } },
        batch: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true, role: true } },
        ...(!isStudent && {
          questions: {
            include: {
              question: {
                select: {
                  id: true,
                  questionText: true,
                  marks: true,
                  difficulty: true,
                  subject: { select: { name: true } }
                }
              }
            }
          }
        })
      }
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found'
      });
    }

    if (isStudent) {
      const student = await prisma.student.findUnique({ where: { userId: req.user.userId } });
      if (!student || exam.batchId !== student.batchId) {
        return res.status(403).json({ message: 'Access denied to this exam.' });
      }
    }

    return res.status(200).json(exam);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update exam details
 * @route   PUT /api/v1/exams/:id
 * @access  Private (Admin, Faculty only)
 */
const updateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, courseId, batchId, examType, examDate, totalMarks, passingMarks } = req.body;

    // Check if exam exists
    const existingExam = await prisma.exam.findUnique({
      where: { id }
    });

    if (!existingExam) {
      return res.status(404).json({
        message: 'Exam not found'
      });
    }

    const updateData = {};

    if (title) {
      updateData.title = title.trim();
    }

    if (courseId && courseId !== existingExam.courseId) {
      // Validate course
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      });
      if (!course) {
        return res.status(400).json({ message: 'Course not found' });
      }
      if (!course.isActive) {
        return res.status(400).json({ message: 'The selected course is inactive' });
      }
      updateData.courseId = courseId;
    }

    const targetCourseId = courseId || existingExam.courseId;

    if (batchId !== undefined) {
      if (batchId === null) {
        updateData.batchId = null;
      } else {
        // Validate batch
        const batch = await prisma.batch.findUnique({
          where: { id: batchId }
        });
        if (!batch) {
          return res.status(400).json({ message: 'Batch not found' });
        }
        if (!batch.isActive) {
          return res.status(400).json({ message: 'The selected batch is inactive' });
        }
        if (batch.courseId !== targetCourseId) {
          return res.status(400).json({ message: 'The selected batch does not belong to the course' });
        }
        updateData.batchId = batchId;
      }
    }

    if (examType) {
      const upperExamType = examType.toUpperCase().trim();
      const validExamTypes = ['INTERNAL', 'EXTERNAL', 'PRACTICAL'];
      if (!validExamTypes.includes(upperExamType)) {
        return res.status(400).json({
          message: `Invalid examType. Must be one of: ${validExamTypes.join(', ')}`
        });
      }
      updateData.examType = upperExamType;
    }

    if (examDate) {
      const parsedDate = new Date(examDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: 'Invalid examDate format'
        });
      }
      updateData.examDate = parsedDate;
    }

    // Validate marks logic if updated
    const finalTotalMarks = totalMarks !== undefined ? parseInt(totalMarks, 10) : existingExam.totalMarks;
    const finalPassingMarks = passingMarks !== undefined ? parseInt(passingMarks, 10) : existingExam.passingMarks;

    if (totalMarks !== undefined) {
      if (isNaN(finalTotalMarks) || finalTotalMarks <= 0) {
        return res.status(400).json({ message: 'totalMarks must be a positive integer' });
      }
      updateData.totalMarks = finalTotalMarks;
    }

    if (passingMarks !== undefined) {
      if (isNaN(finalPassingMarks) || finalPassingMarks <= 0) {
        return res.status(400).json({ message: 'passingMarks must be a positive integer' });
      }
      updateData.passingMarks = finalPassingMarks;
    }

    if (finalPassingMarks > finalTotalMarks) {
      return res.status(400).json({
        message: 'passingMarks cannot be greater than totalMarks'
      });
    }

    // Perform update
    const updatedExam = await prisma.exam.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: { id: true, name: true, code: true }
        },
        batch: {
          select: { id: true, name: true }
        },
        creator: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return res.status(200).json({
      message: 'Exam updated successfully',
      data: updatedExam
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an exam (Admin only)
 * @route   DELETE /api/v1/exams/:id
 * @access  Private (Admin only)
 */
const deleteExam = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingExam = await prisma.exam.findUnique({
      where: { id }
    });

    if (!existingExam) {
      return res.status(404).json({
        message: 'Exam not found'
      });
    }

    const resultCount = await prisma.examResult.count({ where: { examId: id } });
    if (resultCount > 0) {
      return res.status(400).json({
        message: `Exam has ${resultCount} student result(s) and cannot be deleted. Historical grade data must be preserved.`
      });
    }

    await prisma.exam.delete({
      where: { id }
    });

    return res.status(200).json({
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam
};
