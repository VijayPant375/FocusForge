const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Habit = require('./models/Habit');
const authMiddleware = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ AI Service: MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

function generateInsights(habits) {
  const insights = [];

  if (habits.length === 0) {
    return [{
      type: 'welcome',
      message: 'Start tracking your first habit to receive personalized insights!',
      icon: '🎯'
    }];
  }

  const avgStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0) / habits.length;
  if (avgStreak >= 7) {
    insights.push({
      type: 'positive',
      message: `Impressive! You're maintaining an average ${Math.round(avgStreak)}-day streak. Keep it up!`,
      icon: '🔥'
    });
  } else if (avgStreak < 3 && habits.length > 0) {
    insights.push({
      type: 'motivation',
      message: 'Building habits takes time. Focus on consistency over perfection.',
      icon: '💪'
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedToday = habits.filter(h => 
    h.completions.some(c => {
      const cDate = new Date(c.date);
      cDate.setHours(0, 0, 0, 0);
      return cDate.getTime() === today.getTime();
    })
  ).length;

  if (completedToday === habits.length && habits.length > 0) {
    insights.push({
      type: 'achievement',
      message: '🎉 Perfect day! All habits completed!',
      icon: '✨'
    });
  }

  const morningHabits = habits.filter(h => {
    return h.completions.some(c => {
      const hour = new Date(c.date).getHours();
      return hour >= 5 && hour < 12;
    });
  });

  if (morningHabits.length > habits.length * 0.6) {
    insights.push({
      type: 'pattern',
      message: 'You are most consistent in the morning hours. Try scheduling important habits early!',
      icon: '🌅'
    });
  }

  const habitsWithLongStreaks = habits.filter(h => h.longestStreak > 10);
  if (habitsWithLongStreaks.length > 0) {
    insights.push({
      type: 'positive',
      message: `You've built ${habitsWithLongStreaks.length} strong habit(s) with 10+ day streaks!`,
      icon: '🏆'
    });
  }

  const strugglingHabits = habits.filter(h => h.currentStreak < 2 && h.completions.length > 5);
  if (strugglingHabits.length > 0) {
    insights.push({
      type: 'suggestion',
      message: `${strugglingHabits.length} habit(s) need attention. Try breaking them into smaller steps.`,
      icon: '💡'
    });
  }

  const categoryCount = {};
  habits.forEach(h => {
    categoryCount[h.category] = (categoryCount[h.category] || 0) + 1;
  });
  const topCategory = Object.keys(categoryCount).sort((a, b) => categoryCount[b] - categoryCount[a])[0];
  
  if (topCategory && categoryCount[topCategory] > 2) {
    insights.push({
      type: 'insight',
      message: `Your focus is on ${topCategory}. Consider diversifying for balanced growth.`,
      icon: '🎯'
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'neutral',
      message: 'Keep tracking your habits to unlock personalized insights.',
      icon: '📊'
    });
  }

  return insights;
}

app.get('/insights', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId });
    const insights = generateInsights(habits);
    
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`✅ AI Service running on port ${PORT}`);
});
