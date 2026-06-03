const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Notification Service: MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.HABIT_SERVICE_URL}/`,
      { headers: { Authorization: req.headers.authorization } }
    );

    const habits = response.data.habits;

    const today = new Date();
    // 'days' array has short names like 'Mon', 'Tue' in Habit model default: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    const todayDay = today.toLocaleDateString('en-US', { weekday: 'short' }); 
    const todayDateStr = today.toISOString().split('T')[0];

    const pending = habits.filter(habit => {
      if (!habit.reminder?.enabled) return false;
      if (!habit.reminder?.days?.includes(todayDay)) return false;

      // Check not already completed today
      const completedToday = habit.completions?.some(c =>
        c.date?.startsWith(todayDateStr)
      );
      return !completedToday;
    });

    res.json(pending);
  } catch (err) {
    console.error('[NOTIFICATIONS] Error fetching pending reminders:', err.message);
    res.status(500).json({ error: 'Could not fetch notifications' });
  }
});

cron.schedule('* * * * *', async () => {
  // This runs every minute
  // Fetch all habits with reminders enabled across all users is not possible
  // without iterating users — skip the cross-user cron for now
  // The cron job is a local-dev feature only; it does not fire on Render free tier
  // because the service sleeps when idle
  console.log('[CRON] Notification check tick — implement per-user sweep if needed');
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`✅ Notification Service running on port ${PORT}`);
});
