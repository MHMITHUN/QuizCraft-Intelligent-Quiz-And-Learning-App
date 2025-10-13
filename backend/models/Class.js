const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: String,
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  quizzes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  }],
  subject: String,
  grade: String,
  institution: String,
  schedule: {
    days: [String],
    time: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxStudents: {
    type: Number,
    default: 50
  },
  settings: {
    allowStudentDiscussions: {
      type: Boolean,
      default: true
    },
    autoGrading: {
      type: Boolean,
      default: true
    },
    showLeaderboard: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Generate unique class code before saving
classSchema.pre('save', function(next) {
  if (!this.code) {
    this.code = generateClassCode();
  }
  next();
});

function generateClassCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Indexes
classSchema.index({ teacher: 1 });
classSchema.index({ code: 1 });
classSchema.index({ students: 1 });

module.exports = mongoose.model('Class', classSchema);
