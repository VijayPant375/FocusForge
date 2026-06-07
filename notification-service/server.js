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

const webpush = require('web-push');
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || 'mailto:test@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  subscription: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});
const PushSubscription = mongoose.model('PushSubscription', subscriptionSchema);

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

    const pending = habits.filter(habit => habit.reminder?.enabled);
    res.json(pending);
  } catch (err) {
    console.error('[NOTIFICATIONS] Error fetching pending reminders:', err.message);
    res.status(500).json({ error: 'Could not fetch notifications' });
  }
});

// ─── POST /subscribe (save VAPID subscription) ───
app.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: 'Subscription missing' });
    
    // Upsert the subscription
    await PushSubscription.findOneAndUpdate(
      { userId: req.userId },
      { userId: req.userId, subscription },
      { upsert: true, new: true }
    );
    res.status(201).json({ message: 'Subscription saved.' });
  } catch (err) {
    console.error('[NOTIFICATIONS] Error saving subscription:', err.message);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

const sendPushNotification = async (userId, title, body) => {
  try {
    const subRecord = await PushSubscription.findOne({ userId });
    if (!subRecord) return;
    await webpush.sendNotification(subRecord.subscription, JSON.stringify({ title, body }));
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log(`[PUSH] Subscription expired for user ${userId}, removing from DB.`);
      await PushSubscription.deleteOne({ userId });
    } else {
      console.error('[PUSH] Failed to send push notification:', err.message);
    }
  }
};

// ─── Cron: runs every minute, sweeps all habits for due reminders ─────────────
// Queries MongoDB directly so it can check across all users without needing
// individual auth tokens. Logs one structured line per due habit.
// To add VAPID browser push: replace the console.log with a web-push call using
// a stored subscription object (requires a separate subscriptions collection).
cron.schedule('* * * * *', async () => {
  try {
    const now          = new Date();
    const timeString   = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const DAY_NAMES    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayDay     = DAY_NAMES[now.getDay()];
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
      sendPushNotification(habit.userId, 'FocusForge Reminder', `Time for your habit: ${habit.name}`);
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
