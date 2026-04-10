const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: String,
  name: String,
  description: String,
  category: String,
  frequency: String,
  completions: [{
    date: Date,
    completed: Boolean
  }],
  currentStreak: Number,
  longestStreak: Number,
  createdAt: Date
});

module.exports = mongoose.model('Habit', habitSchema);
