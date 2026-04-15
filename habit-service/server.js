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
    const habits = await Habit.find({ userId: req.userId }).sort({ createdAt: -1 });
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
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }
    
    res.json({ message: 'Habit deleted' });
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
