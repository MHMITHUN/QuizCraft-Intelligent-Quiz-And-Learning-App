const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Class = require('../models/Class');
const Quiz = require('../models/Quiz');

// Create class (teacher)
router.post('/', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const { name, description, subject, grade, institution } = req.body;
    const klass = await Class.create({ name, description, subject, grade, institution, teacher: req.user._id });
    res.status(201).json({ success: true, data: { class: klass } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to create class' });
  }
});

// Join class by code (student)
router.post('/join', protect, authorize('student','teacher','admin'), async (req, res) => {
  try {
    const { code } = req.body;
    const klass = await Class.findOne({ code });
    if (!klass) return res.status(404).json({ success: false, message: 'Invalid class code' });
    if (!klass.students.some(s => s.toString() === req.user._id.toString())) {
      klass.students.push(req.user._id);
      await klass.save();
    }
    res.json({ success: true, message: 'Joined class', data: { class: klass } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to join class' });
  }
});

// Assign quiz to class (teacher)
router.post('/:id/assign', protect, authorize('teacher','admin'), async (req, res) => {
  try {
    const { quizId } = req.body;
    const klass = await Class.findById(req.params.id);
    if (!klass) return res.status(404).json({ success: false, message: 'Class not found' });
    if (klass.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (!klass.quizzes.some(q => q.toString() === quiz._id.toString())) {
      klass.quizzes.push(quiz._id);
      await klass.save();
    }
    res.json({ success: true, message: 'Quiz assigned', data: { class: klass } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to assign quiz' });
  }
});

// My classes (teacher sees owned, student sees joined)
router.get('/mine', protect, async (req, res) => {
  try {
    let classes;
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      classes = await Class.find({ teacher: req.user._id }).populate('quizzes','title');
    } else {
      classes = await Class.find({ students: req.user._id }).populate('quizzes','title');
    }
    res.json({ success: true, data: { classes } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch classes' });
  }
});

// Class details
router.get('/:id', protect, async (req, res) => {
  try {
    const klass = await Class.findById(req.params.id)
      .populate('teacher','name email')
      .populate('students','name email')
      .populate('quizzes','title category');
    if (!klass) return res.status(404).json({ success: false, message: 'Class not found' });
    res.json({ success: true, data: { class: klass } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch class' });
  }
});

module.exports = router;
