const mongoose = require('mongoose');

const attemptAnswerSchema = new mongoose.Schema({
  questionId: mongoose.Schema.Types.ObjectId,
  questionText: String,
  userAnswer: String,
  correctAnswer: String,
  isCorrect: Boolean,
  points: Number,
  timeTaken: Number // seconds spent on this question
});

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [attemptAnswerSchema],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalPoints: Number,
  earnedPoints: Number,
  timeTaken: {
    type: Number, // in seconds
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  isPassed: Boolean,
  rank: Number, // User's rank among all attempts for this quiz
  deviceInfo: {
    platform: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for performance
quizAttemptSchema.index({ quiz: 1, user: 1, createdAt: -1 });
quizAttemptSchema.index({ user: 1, completedAt: -1 });
quizAttemptSchema.index({ quiz: 1, score: -1 });
quizAttemptSchema.index({ status: 1 });

// Calculate rank after completion
quizAttemptSchema.pre('save', async function(next) {
  if (this.isModified('completedAt') && this.completedAt) {
    const rank = await mongoose.model('QuizAttempt').countDocuments({
      quiz: this.quiz,
      score: { $gt: this.score },
      status: 'completed'
    });
    this.rank = rank + 1;
  }
  next();
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
