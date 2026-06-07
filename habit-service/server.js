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
  .then(() => console.log('✅ Habit Service: MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, frequency } = req.body;
    
    const habit = new Habit({
      userId: req.userId,
      name,
      description,
      category,
      frequency
    });
    
    await habit.save();
    res.status(201).json({ message: 'Habit created', habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId, archived: { $ne: true } }).sort({ createdAt: -1 });
    res.json({ habits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/export', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId });
    const format = req.query.format || 'json';

    if (format === 'csv') {
      let csv = 'Name,Category,Created At,Current Streak,Longest Streak,Total Completions\n';
      habits.forEach(h => {
        const name = `"${(h.name || '').replace(/"/g, '""')}"`;
        const category = `"${(h.category || '').replace(/"/g, '""')}"`;
        const createdAt = h.createdAt ? h.createdAt.toISOString().split('T')[0] : '';
        const currentStreak = h.currentStreak || 0;
        const longestStreak = h.longestStreak || 0;
        const totalCompletions = h.completions ? h.completions.length : 0;
        csv += `${name},${category},${createdAt},${currentStreak},${longestStreak},${totalCompletions}\n`;
      });
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename="habits.csv"');
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      res.header('Content-Disposition', 'attachment; filename="habits.json"');
      return res.json(habits);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/archived', authMiddleware, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId, archived: true }).sort({ createdAt: -1 });
    res.json({ habits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/:id', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json({ message: 'Habit updated', habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate({
      _id: req.params.id,
      userId: req.userId
    }, { archived: true }, { new: true });
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json({ message: 'Habit archived' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/:id/permanent', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json({ message: 'Habit permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/:id/restore', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { archived: false },
      { new: true }
    );
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    res.json({ message: 'Habit restored', habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const alreadyCompleted = habit.completions.some(c => {
      const cDate = new Date(c.date);
      cDate.setHours(0, 0, 0, 0);
      return cDate.getTime() === today.getTime();
    });
    
    if (alreadyCompleted) {
      return res.status(400).json({ error: 'Already completed today' });
    }

    // 2.5 Accept mood & energy with completion
    const { mood, energy } = req.body;
    habit.completions.push({ date: today, completed: true, mood: mood || null, energy: energy || null });
    habit.calculateStreak();
    await habit.save();
    
    // 2.1 If this habit has a chain, return the chained habit as a suggestion
    let chainedHabit = null;
    if (habit.chainedTo) {
      chainedHabit = await Habit.findOne({ _id: habit.chainedTo, userId: req.userId });
    }

    res.json({ message: 'Habit completed', habit, chainedHabit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2.1 Habit Chain Routes
app.post('/:id/chain', authMiddleware, async (req, res) => {
  try {
    const { chainToId } = req.body;
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { chainedTo: chainToId || null },
      { new: true }
    );
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json({ message: 'Chain updated', habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/sync-offline', authMiddleware, async (req, res) => {
  try {
    const completions = req.body; // array of { habitId, completedAt, mood, energy }
    if (!Array.isArray(completions)) {
      return res.status(400).json({ error: 'Expected an array of completions' });
    }

    let synced = 0;
    let skipped = 0;

    for (const item of completions) {
      try {
        const habit = await Habit.findOne({ _id: item.habitId, userId: req.userId });
        if (!habit) {
          skipped++;
          continue;
        }

        const dateToLog = new Date(item.completedAt || new Date());
        dateToLog.setHours(0, 0, 0, 0);

        const alreadyCompleted = habit.completions.some(c => {
          const cDate = new Date(c.date);
          cDate.setHours(0, 0, 0, 0);
          return cDate.getTime() === dateToLog.getTime();
        });

        if (alreadyCompleted) {
          skipped++;
          continue;
        }

        habit.completions.push({
          date: dateToLog,
          completed: true,
          mood: item.mood || null,
          energy: item.energy || null
        });
        habit.calculateStreak();
        await habit.save();
        synced++;
      } catch (err) {
        console.error(`Error syncing habit ${item.habitId}:`, err);
        skipped++;
      }
    }

    res.json({ message: 'Offline sync complete', synced, skipped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/:id/chain', authMiddleware, async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { chainedTo: null },
      { new: true }
    );
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json({ message: 'Chain removed', habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2.4 Reminder Settings
app.put('/:id/reminder', authMiddleware, async (req, res) => {
  try {
    const { enabled, time, days } = req.body;
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { reminder: { enabled, time, days } },
      { new: true }
    );
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json({ message: 'Reminder updated', habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`✅ Habit Service running on port ${PORT}`);
});
