const prisma = require('../db');

/**
 * @desc    Submit / Edit results in bulk for an exam
 * @route   POST /api/v1/exams/:id/results
 * @access  Private (Admin, Faculty only)
 */
const submitBulkResults = async (req, res, next) => {
  try {
    const { id } = req.params; // Exam ID
    const { results } = req.body; // Array of { studentId, marksObtained, status, remarks }

    // Validate exam exists
    const exam = await prisma.exam.findUnique({
      where: { id }
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found'
      });
    }

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        message: 'Missing required field. results must be a non-empty array.'
      });
    }

    const errors = [];
    const validatedResults = [];

    // Pre-validate all entries before database writes
    for (let i = 0; i < results.length; i++) {
      const entry = results[i];
      const { studentId, marksObtained, status, remarks } = entry;

      if (!studentId) {
        errors.push(`Row ${i + 1}: studentId is required`);
        continue;
      }

      if (marksObtained === undefined || marksObtained === null) {
        errors.push(`Row ${i + 1} (Student ID: ${studentId}): marksObtained is required`);
        continue;
      }

      const parsedMarks = parseFloat(marksObtained);
      if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > exam.totalMarks) {
        errors.push(`Row ${i + 1} (Student ID: ${studentId}): marksObtained must be a number between 0 and ${exam.totalMarks}`);
        continue;
      }

      // Check if student exists and matches course/batch restrictions
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        errors.push(`Row ${i + 1} (Student ID: ${studentId}): Student not found`);
        continue;
      }

      if (!student.isActive) {
        errors.push(`Row ${i + 1} (Student ID: ${studentId}): Student is inactive`);
        continue;
      }

      // If exam is batch-specific, verify student is in that batch
      if (exam.batchId && student.batchId !== exam.batchId) {
        errors.push(`Row ${i + 1} (Student ID: ${studentId}): Student is not in batch '${exam.batchId}' assigned to this exam`);
        continue;
      }

      // If exam is course-wide, verify student is in that course
      if (student.courseId !== exam.courseId) {
        errors.push(`Row ${i + 1} (Student ID: ${studentId}): Student is not enrolled in course '${exam.courseId}' assigned to this exam`);
        continue;
      }

      // Validate manually passed status if present
      let finalStatus;
      if (status) {
        const upperStatus = status.toUpperCase().trim();
        const validStatuses = ['PASS', 'FAIL', 'WITHHELD'];
        if (!validStatuses.includes(upperStatus)) {
          errors.push(`Row ${i + 1} (Student ID: ${studentId}): Invalid status. Must be PASS, FAIL, or WITHHELD`);
          continue;
        }
        finalStatus = upperStatus;
      } else {
        // Auto compute status
        finalStatus = parsedMarks >= exam.passingMarks ? 'PASS' : 'FAIL';
      }

      validatedResults.push({
        studentId,
        marksObtained: parsedMarks,
        status: finalStatus,
        remarks: remarks ? remarks.trim() : null
      });
    }

    // If there are validation errors, return them immediately without committing
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed for one or more results',
        errors
      });
    }

    // Execute bulk upsert in a database transaction
    const savedCount = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const entry of validatedResults) {
        await tx.examResult.upsert({
          where: {
            examId_studentId: {
              examId: id,
              studentId: entry.studentId
            }
          },
          update: {
            marksObtained: entry.marksObtained,
            status: entry.status,
            remarks: entry.remarks,
            enteredBy: req.user.userId
          },
          create: {
            examId: id,
            studentId: entry.studentId,
            marksObtained: entry.marksObtained,
            status: entry.status,
            remarks: entry.remarks,
            enteredBy: req.user.userId
          }
        });
        count++;
      }
      return count;
    });

    return res.status(200).json({
      message: 'Exam results submitted successfully',
      summary: {
        saved: savedCount,
        errors: []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all student results for a specific exam
 * @route   GET /api/v1/exams/:id/results
 * @access  Private (Admin, Faculty only)
 */
const getExamResults = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate exam exists
    const exam = await prisma.exam.findUnique({
      where: { id }
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found'
      });
    }

    // Retrieve results with student details
    const results = await prisma.examResult.findMany({
      where: { examId: id },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        student: {
          rollNumber: 'asc'
        }
      }
    });

    // Reformat output payload
    const reformattedResults = results.map(r => ({
      id: r.id,
      examId: r.examId,
      studentId: r.studentId,
      studentName: r.student?.user?.name || 'N/A',
      rollNumber: r.student?.rollNumber || 'N/A',
      marksObtained: r.marksObtained,
      status: r.status,
      remarks: r.remarks
    }));

    return res.status(200).json(reformattedResults);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit or update score for a single student result
 * @route   PUT /api/v1/exams/:id/results/:studentId
 * @access  Private (Admin, Faculty only)
 */
const updateSingleResult = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;
    const { marksObtained, status, remarks } = req.body;

    // Verify exam exists
    const exam = await prisma.exam.findUnique({
      where: { id }
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Exam not found'
      });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({
        message: 'Student not found'
      });
    }

    if (!student.isActive) {
      return res.status(400).json({
        message: 'Cannot record results for an inactive student'
      });
    }

    // Verify student enrollment matches exam course/batch
    if (exam.batchId && student.batchId !== exam.batchId) {
      return res.status(400).json({
        message: 'Student does not belong to the batch assigned to this exam'
      });
    }

    if (student.courseId !== exam.courseId) {
      return res.status(400).json({
        message: 'Student is not enrolled in the course assigned to this exam'
      });
    }

    // Validate marksObtained
    if (marksObtained === undefined || marksObtained === null) {
      return res.status(400).json({
        message: 'Missing required field. marksObtained is required.'
      });
    }

    const parsedMarks = parseFloat(marksObtained);
    if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > exam.totalMarks) {
      return res.status(400).json({
        message: `marksObtained must be a number between 0 and ${exam.totalMarks}`
      });
    }

    // Validate manually passed status if present
    let finalStatus;
    if (status) {
      const upperStatus = status.toUpperCase().trim();
      const validStatuses = ['PASS', 'FAIL', 'WITHHELD'];
      if (!validStatuses.includes(upperStatus)) {
        return res.status(400).json({
          message: 'Invalid status. Must be PASS, FAIL, or WITHHELD'
        });
      }
      finalStatus = upperStatus;
    } else {
      // Auto compute status
      finalStatus = parsedMarks >= exam.passingMarks ? 'PASS' : 'FAIL';
    }

    // Update or insert single result
    const result = await prisma.examResult.upsert({
      where: {
        examId_studentId: {
          examId: id,
          studentId
        }
      },
      update: {
        marksObtained: parsedMarks,
        status: finalStatus,
        remarks: remarks !== undefined ? (remarks ? remarks.trim() : null) : undefined,
        enteredBy: req.user.userId
      },
      create: {
        examId: id,
        studentId,
        marksObtained: parsedMarks,
        status: finalStatus,
        remarks: remarks ? remarks.trim() : null,
        enteredBy: req.user.userId
      },
      include: {
        student: {
          select: {
            rollNumber: true,
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Exam result saved successfully',
      data: {
        id: result.id,
        examId: result.examId,
        studentId: result.studentId,
        studentName: result.student?.user?.name || 'N/A',
        rollNumber: result.student?.rollNumber || 'N/A',
        marksObtained: result.marksObtained,
        status: result.status,
        remarks: result.remarks
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitBulkResults,
  getExamResults,
  updateSingleResult
};
