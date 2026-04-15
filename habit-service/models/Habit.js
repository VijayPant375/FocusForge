const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['health', 'productivity', 'mindfulness', 'learning', 'fitness', 'other'],
    default: 'other'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily'
  },
  // 2.1 Habit Chains
  chainedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    default: null
  },
  // 2.4 Reminders
  reminder: {
    enabled: { type: Boolean, default: false },
    time: { type: String, default: '08:00' },
    days: { type: [String], default: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] }
  },
  completions: [{
    date: {
      type: Date,
      required: true
    },
    completed: {
      type: Boolean,
      default: true
    },
    // 2.5 Mood & Energy
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'tired', 'stressed', null],
      default: null
    },
    energy: {
      type: Number,
      min: 1,
      max: 10,
      default: null
    }
  }],
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


habitSchema.methods.calculateStreak = function() {
  if (this.completions.length === 0) {
    this.currentStreak = 0;
    return;
  }

  const sortedCompletions = this.completions
    .filter(c => c.completed)
    .sort((a, b) => b.date - a.date);

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedCompletions.length; i++) {
    const completionDate = new Date(sortedCompletions[i].date);
    completionDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today - completionDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === i) {
      streak++;
    } else {
      break;
    }
  }

  this.currentStreak = streak;
  if (streak > this.longestStreak) {
    this.longestStreak = streak;
  }
};

module.exports = mongoose.model('Habit', habitSchema);
