const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const QuizHistory = require('../models/QuizHistory');
const LegacyQuizHistory = require('../models/LegacyQuizHistory');

// GET /api/history - current user's quiz history (new collection primary, legacy readable)
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const history = await QuizHistory.find({ user: req.user._id })
      .populate('quiz', 'title category difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Optionally include legacy latest entries if any
    const legacy = await LegacyQuizHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('_id quiz percentage createdAt');

    const total = await QuizHistory.countDocuments({ user: req.user._id });

    res.json({ success: true, data: { history, legacy, pagination: { page: parseInt(page), limit: parseInt(limit), total } } });
  } catch (error) {
    console.error('History GET error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// GET /api/history/:id - get specific history by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const history = await QuizHistory.findById(req.params.id)
      .populate('quiz', 'title description category questions')
      .populate('user', 'name email');

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History not found'
      });
    }

    // Check ownership
    if (history.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      data: { history }
    });
  } catch (error) {
    console.error('History detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history details'
    });
  }
});

// POST /api/history - save quiz attempt
router.post('/', protect, async (req, res) => {
  try {
    const { quizId, answers, timeTaken = 0 } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // Grade answers
    let correctAnswers = 0;
    let score = 0;
    const detailedAnswers = [];

    quiz.questions.forEach((question, index) => {
      const userAnswer = answers?.[index];
      let isCorrect = false;
      if (question.type === 'mcq') {
        const correctOption = question.options.find(o => o.isCorrect);
        isCorrect = userAnswer === correctOption?.text;
      } else if (question.type === 'true-false') {
        isCorrect = userAnswer === question.correctAnswer;
      } else {
        isCorrect = userAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
      }
      if (isCorrect) { correctAnswers++; score += question.points; }
      detailedAnswers.push({
        questionId: question._id,
        userAnswer,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });
    });

    const percentage = (correctAnswers / quiz.questions.length) * 100;
    const passed = percentage >= quiz.passingScore;

    const history = await QuizHistory.create({
      user: req.user._id,
      quiz: quiz._id,
      answers: detailedAnswers,
      score,
      percentage,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      incorrectAnswers: quiz.questions.length - correctAnswers,
      timeTaken,
      passed
    });

    await req.user.incrementUsage('taken');
    req.user.points += score; await req.user.save();

    quiz.analytics.totalAttempts += 1;
    quiz.analytics.averageScore = ((quiz.analytics.averageScore * (quiz.analytics.totalAttempts - 1) + percentage) / quiz.analytics.totalAttempts);
    await quiz.save();

    res.status(201).json({ success: true, message: 'Attempt saved', data: { historyId: history._id } });
  } catch (error) {
    console.error('History POST error:', error);
    res.status(500).json({ success: false, message: 'Failed to save history' });
  }
});

module.exports = router;
