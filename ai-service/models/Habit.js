const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    default: 'other',
  },
  frequency: {
    type: String,
    default: 'daily',
  },
  chainedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    default: null,
  },
  reminder: {
    enabled: { type: Boolean, default: false },
    time: { type: String, default: '08:00' },
    days: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  },
  completions: [{
    date: Date,
    completed: Boolean,
    mood: String,
    energy: Number,
  }],
  currentStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Habit', habitSchema);
