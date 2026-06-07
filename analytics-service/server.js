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
  .then(() => console.log('✅ Analytics Service: MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/stats', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId, archived: { $ne: true } });
    
    const totalHabits = habits.length;
    const totalCompletions = habits.reduce((sum, h) => sum + h.completions.length, 0);
    const avgStreak = habits.length > 0 
      ? habits.reduce((sum, h) => sum + h.currentStreak, 0) / habits.length 
      : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedToday = habits.filter(h => 
      h.completions.some(c => {
        const cDate = new Date(c.date);
        cDate.setHours(0, 0, 0, 0);
        return cDate.getTime() === today.getTime();
      })
    ).length;
    
    const completionRate = totalHabits > 0 
      ? Math.round((completedToday / totalHabits) * 100) 
      : 0;
    
    res.json({
      totalHabits,
      totalCompletions,
      avgStreak: Math.round(avgStreak * 10) / 10,
      completedToday,
      completionRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/weekly', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId, archived: { $ne: true } });
    
    const weekData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const completed = habits.filter(h => 
        h.completions.some(c => {
          const cDate = new Date(c.date);
          cDate.setHours(0, 0, 0, 0);
          return cDate.getTime() === date.getTime();
        })
      ).length;
      
      weekData.push({
        date: date.toISOString().split('T')[0],
        completed,
        total: habits.length
      });
    }
    
    res.json({ weekData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/weekly-review', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId, archived: { $ne: true } });
    
    let totalCompletionsThisWeek = 0;
    let bestStreak = 0;
    let mostConsistentHabit = null;
    let maxHabitCompletions = -1;

    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    habits.forEach(habit => {
      // Find completions this week
      const completionsThisWeek = habit.completions.filter(c => {
        const cDate = new Date(c.date);
        return cDate >= oneWeekAgo && cDate <= today;
      });
      totalCompletionsThisWeek += completionsThisWeek.length;
      
      if (habit.longestStreak > bestStreak) {
        bestStreak = habit.longestStreak;
      }
      
      if (completionsThisWeek.length > maxHabitCompletions) {
        maxHabitCompletions = completionsThisWeek.length;
        mostConsistentHabit = habit.name;
      }
    });

    const completionRate = habits.length > 0 ? Math.round((totalCompletionsThisWeek / (habits.length * 7)) * 100) : 0;

    res.json({
      totalCompletionsThisWeek,
      bestStreak,
      mostConsistentHabit,
      completionRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`✅ Analytics Service running on port ${PORT}`);
});
