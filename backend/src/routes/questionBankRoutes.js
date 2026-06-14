const express = require('express');
const router = express.Router();

const {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionBankController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', authenticate, authorize('ADMIN', 'FACULTY'), getQuestions);
router.post('/', authenticate, authorize('ADMIN', 'FACULTY'), createQuestion);
router.get('/:id', authenticate, authorize('ADMIN', 'FACULTY'), getQuestionById);
router.put('/:id', authenticate, authorize('ADMIN', 'FACULTY'), updateQuestion);
router.delete('/:id', authenticate, authorize('ADMIN', 'FACULTY'), deleteQuestion);

module.exports = router;
