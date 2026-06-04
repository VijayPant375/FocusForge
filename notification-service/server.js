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

// Lightweight read-only Habit schema — mirrors only the fields needed for reminder checks.
// The full schema lives in habit-service; this projection avoids duplicating business logic.
const habitSchema = new mongoose.Schema({
  userId:   { type: String, required: true },
  name:     { type: String, required: true },
  reminder: {
    enabled: { type: Boolean, default: false },
    time:    { type: String, default: '' },   // "HH:MM"
    days:    { type: [String], default: [] }, // ['Mon','Tue',...]
  },
  completions: [
    {
      date:      { type: Date },
      completed: { type: Boolean, default: true },
    },
  ],
}, { collection: 'habits', strict: false });

const Habit = mongoose.models.Habit || mongoose.model('Habit', habitSchema);

// ─── Per-user pending-reminder endpoint (called by the dashboard bell icon) ──
app.get('/', authMiddleware, async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.HABIT_SERVICE_URL}/`,
      { headers: { Authorization: req.headers.authorization } }
    );

    const habits = response.data.habits;

    const today = new Date();
    // 'days' array uses short names like 'Mon', 'Tue' matching the Habit model default
    const todayDay     = today.toLocaleDateString('en-US', { weekday: 'short' });
    const todayDateStr = today.toISOString().split('T')[0];

    const pending = habits.filter(habit => {
      if (!habit.reminder?.enabled) return false;
      if (!habit.reminder?.days?.includes(todayDay)) return false;

      // Exclude habits already completed today
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

// ─── Cron: runs every minute, sweeps all habits for due reminders ─────────────
// Queries MongoDB directly so it can check across all users without needing
// individual auth tokens. Logs one structured line per due habit.
// To add VAPID browser push: replace the console.log with a web-push call using
// a stored subscription object (requires a separate subscriptions collection).
cron.schedule('* * * * *', async () => {
  try {
    const now          = new Date();
    const timeString   = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayDay     = now.toLocaleDateString('en-US', { weekday: 'short' });
    const todayDateStr = now.toISOString().split('T')[0];

    // Skip if Mongoose is not yet connected
    if (mongoose.connection.readyState !== 1) {
      console.warn('[CRON] MongoDB not ready — skipping reminder check');
      return;
    }

    const candidates = await Habit.find({
      'reminder.enabled': true,
      'reminder.time':    timeString,
      'reminder.days':    todayDay,
    }).lean();

    if (candidates.length === 0) return;

    // Filter out habits already completed today
    const due = candidates.filter(habit =>
      !habit.completions?.some(c => {
        const d = c.date ? new Date(c.date).toISOString().split('T')[0] : '';
        return d === todayDateStr && c.completed !== false;
      })
    );

    due.forEach(habit => {
      console.log(
        `[CRON] 🔔 Reminder due | user=${habit.userId} | habit="${habit.name}" | time=${timeString}`
      );
      // TODO: send VAPID push here when push service is configured
      // webpush.sendNotification(subscription, JSON.stringify({
      //   title: 'FocusForge Reminder',
      //   body: `Time for your habit: ${habit.name}`,
      // }));
    });

    if (due.length > 0) {
      console.log(`[CRON] ${due.length} reminder(s) triggered at ${timeString}`);
    }
  } catch (err) {
    console.error('[CRON] Error during reminder sweep:', err.message);
  }
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`✅ Notification Service running on port ${PORT}`);
});
