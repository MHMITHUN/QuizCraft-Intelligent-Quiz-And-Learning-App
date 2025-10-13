const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['guest', 'student', 'teacher', 'admin'],
    default: 'student'
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'premium', 'institutional'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  usage: {
    quizzesGenerated: {
      type: Number,
      default: 0
    },
    quizzesTaken: {
      type: Number,
      default: 0
    },
    lastQuizDate: Date
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'bn'],
      default: 'en'
    },
    defaultQuizType: {
      type: String,
      enum: ['mcq', 'true-false', 'short-answer'],
      default: 'mcq'
    }
  },
  teacherInfo: {
    institution: String,
    subject: String,
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    classes: [{
      name: String,
      code: String,
      students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }]
  },
  points: {
    type: Number,
    default: 0
  },
  avatar: String,
  phone: String,
  bio: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has reached quiz limit
userSchema.methods.canGenerateQuiz = function() {
  if (this.role === 'admin') return true;
  
  const limit = this.subscription.plan === 'free' 
    ? parseInt(process.env.FREE_QUIZ_LIMIT) 
    : parseInt(process.env.PREMIUM_QUIZ_LIMIT);
  
  return this.usage.quizzesGenerated < limit;
};

// Method to increment usage
userSchema.methods.incrementUsage = async function(type) {
  if (type === 'generated') {
    this.usage.quizzesGenerated += 1;
    this.usage.lastQuizDate = new Date();
  } else if (type === 'taken') {
    this.usage.quizzesTaken += 1;
  }
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
