const prisma = require('../db');

/**
 * @desc    Create a new question in the question bank
 * @route   POST /api/v1/question-bank
 * @access  Private (Admin, Faculty only)
 */
const createQuestion = async (req, res, next) => {
  try {
    const { subjectId, questionText, options, correctAnswer, marks, difficulty } = req.body;

    // Validate required fields
    if (!subjectId || !questionText || !correctAnswer) {
      return res.status(400).json({
        message: 'Missing required fields. subjectId, questionText, and correctAnswer are required.'
      });
    }

    // Verify subject exists and is active
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId }
    });

    if (!subject) {
      return res.status(400).json({
        message: 'Subject not found'
      });
    }

    if (!subject.isActive) {
      return res.status(400).json({
        message: 'The selected subject is inactive. Cannot add questions to it.'
      });
    }

    // Validate options if provided (must be an array of strings)
    if (options && !Array.isArray(options)) {
      return res.status(400).json({ message: 'options must be an array of strings' });
    }
    if (options && options.length > 0 && !options.includes(correctAnswer.trim())) {
      return res.status(400).json({ message: 'correctAnswer must be one of the provided options.' });
    }

    // Validate difficulty format if provided
    let targetDifficulty = 'MEDIUM';
    if (difficulty) {
      const upperDiff = difficulty.toUpperCase().trim();
      const validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
      if (!validDifficulties.includes(upperDiff)) {
        return res.status(400).json({
          message: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`
        });
      }
      targetDifficulty = upperDiff;
    }

    // Validate marks if provided
    let targetMarks = 1;
    if (marks !== undefined) {
      const parsedMarks = parseInt(marks, 10);
      if (isNaN(parsedMarks) || parsedMarks <= 0) {
        return res.status(400).json({
          message: 'marks must be a positive integer'
        });
      }
      targetMarks = parsedMarks;
    }

    // Create the question
    const question = await prisma.questionBank.create({
      data: {
        subjectId,
        questionText: questionText.trim(),
        options: options || [],
        correctAnswer: correctAnswer.trim(),
        marks: targetMarks,
        difficulty: targetDifficulty,
        createdBy: req.user.userId
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Question added to bank successfully',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all questions in the question bank (filterable)
 * @route   GET /api/v1/question-bank
 * @access  Private (Admin, Faculty only)
 */
const getQuestions = async (req, res, next) => {
  try {
    const { subjectId, difficulty, search } = req.query;

    const where = {};

    // Filter by subjectId
    if (subjectId) {
      where.subjectId = subjectId;
    }

    // Filter by difficulty
    if (difficulty) {
      const upperDiff = difficulty.toUpperCase().trim();
      const validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
      if (validDifficulties.includes(upperDiff)) {
        where.difficulty = upperDiff;
      }
    }

    // Search filter (questionText)
    if (search) {
      where.questionText = {
        contains: search.trim(),
        mode: 'insensitive'
      };
    }

    const questions = await prisma.questionBank.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(questions);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get question details by ID
 * @route   GET /api/v1/question-bank/:id
 * @access  Private (Admin, Faculty only)
 */
const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await prisma.questionBank.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({
        message: 'Question not found in the question bank'
      });
    }

    return res.status(200).json(question);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update question details
 * @route   PUT /api/v1/question-bank/:id
 * @access  Private (Admin, Faculty only)
 */
const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subjectId, questionText, options, correctAnswer, marks, difficulty } = req.body;

    // Check if question exists
    const existingQuestion = await prisma.questionBank.findUnique({
      where: { id }
    });

    if (!existingQuestion) {
      return res.status(404).json({
        message: 'Question not found in the question bank'
      });
    }

    const updateData = {};

    if (subjectId && subjectId !== existingQuestion.subjectId) {
      // Verify subject exists and is active
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId }
      });
      if (!subject) {
        return res.status(400).json({
          message: 'Subject not found'
        });
      }
      if (!subject.isActive) {
        return res.status(400).json({
          message: 'The selected subject is inactive. Cannot associate question with an inactive subject.'
        });
      }
      updateData.subjectId = subjectId;
    }

    if (questionText) {
      updateData.questionText = questionText.trim();
    }

    if (options) {
      if (!Array.isArray(options)) {
        return res.status(400).json({ message: 'options must be an array of strings' });
      }
      updateData.options = options;
    }

    if (correctAnswer) {
      updateData.correctAnswer = correctAnswer.trim();
    }

    // Validate correctAnswer is within the effective options list
    const effectiveOptions = updateData.options || existingQuestion.options;
    const effectiveAnswer = updateData.correctAnswer || existingQuestion.correctAnswer;
    if (effectiveOptions && effectiveOptions.length > 0 && !effectiveOptions.includes(effectiveAnswer)) {
      return res.status(400).json({ message: 'correctAnswer must be one of the provided options.' });
    }

    if (marks !== undefined) {
      const parsedMarks = parseInt(marks, 10);
      if (isNaN(parsedMarks) || parsedMarks <= 0) {
        return res.status(400).json({
          message: 'marks must be a positive integer'
        });
      }
      updateData.marks = parsedMarks;
    }

    if (difficulty) {
      const upperDiff = difficulty.toUpperCase().trim();
      const validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
      if (!validDifficulties.includes(upperDiff)) {
        return res.status(400).json({
          message: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`
        });
      }
      updateData.difficulty = upperDiff;
    }

    // Perform update
    const updatedQuestion = await prisma.questionBank.update({
      where: { id },
      data: updateData,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Question updated successfully',
      data: updatedQuestion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Hard delete a question from the bank
 * @route   DELETE /api/v1/question-bank/:id
 * @access  Private (Admin, Faculty only)
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingQuestion = await prisma.questionBank.findUnique({
      where: { id }
    });

    if (!existingQuestion) {
      return res.status(404).json({
        message: 'Question not found in the question bank'
      });
    }

    const usageCount = await prisma.examQuestion.count({ where: { questionId: id } });
    if (usageCount > 0) {
      return res.status(400).json({
        message: `Question is used in ${usageCount} exam(s) and cannot be deleted. Removing it would rewrite historical exam compositions.`
      });
    }

    await prisma.questionBank.delete({
      where: { id }
    });

    return res.status(200).json({
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion
};
