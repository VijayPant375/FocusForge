const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const Habit = require('./models/Habit');
const authMiddleware = require('./middleware/auth');

const app = express();
const GEMINI_MODEL = 'gemini-2.5-flash';
const INSIGHT_ICONS = ['🤖', '📈', '🎯'];

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('AI Service: MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

function getAiModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

async function generateGeminiText(prompt) {
  const model = getAiModel();
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getLast30DaysIsoDates() {
  const dates = [];
  const today = startOfDay(new Date());

  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

function serializeHabitsForInsights(habits) {
  const last30Days = new Set(getLast30DaysIsoDates());

  return habits.map((habit) => {
    const recentCompletions = habit.completions
      .filter((completion) => last30Days.has(startOfDay(completion.date).toISOString().split('T')[0]))
      .map((completion) => ({
        date: startOfDay(completion.date).toISOString().split('T')[0],
        completed: completion.completed !== false,
        mood: completion.mood || null,
        energy: completion.energy || null,
      }));

    return {
      id: String(habit._id),
      name: habit.name,
      category: habit.category,
      frequency: habit.frequency,
      currentStreak: habit.currentStreak || 0,
      longestStreak: habit.longestStreak || 0,
      completions: recentCompletions,
    };
  });
}

function normalizeLines(text, maxItems = 3) {
  const cleaned = (text || '')
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[\s*-]+/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  if (cleaned.length > 0) {
    return cleaned.slice(0, maxItems);
  }

  return (text || '')
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function generateFallbackInsights(habits) {
  const insights = [];

  if (habits.length === 0) {
    return [{
      type: 'welcome',
      message: 'Start tracking your first habit to receive personalized insights!',
      icon: '🎯',
    }];
  }

  const avgStreak = habits.reduce((sum, habit) => sum + (habit.currentStreak || 0), 0) / habits.length;
  if (avgStreak >= 7) {
    insights.push({
      type: 'positive',
      message: `Your average streak is ${Math.round(avgStreak)} days, which means your routine is sticking.`,
      icon: '🔥',
    });
  } else if (avgStreak < 3) {
    insights.push({
      type: 'motivation',
      message: 'Your streaks are still fragile right now, so aim for repeatable wins instead of bigger goals.',
      icon: '💪',
    });
  }

  const today = startOfDay(new Date()).getTime();
  const completedToday = habits.filter((habit) => habit.completions.some((completion) => (
    startOfDay(completion.date).getTime() === today && completion.completed !== false
  ))).length;

  if (completedToday === habits.length && habits.length > 0) {
    insights.push({
      type: 'achievement',
      message: 'You completed every tracked habit today, which is a strong signal your system is working.',
      icon: '✨',
    });
  }

  const strugglingHabits = habits.filter((habit) => (habit.currentStreak || 0) < 2 && habit.completions.length > 5);
  if (strugglingHabits.length > 0) {
    insights.push({
      type: 'suggestion',
      message: `${strugglingHabits.length} habit(s) are repeatedly resetting, so simplify those before adding anything new.`,
      icon: '💡',
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'neutral',
      message: 'Keep logging consistently and the AI insights will become more specific as your history grows.',
      icon: '📊',
    });
  }

  return insights.slice(0, 3);
}

function buildInsightObjects(messages) {
  return messages.map((message, index) => ({
    type: 'ai',
    message,
    icon: INSIGHT_ICONS[index % INSIGHT_ICONS.length],
  }));
}

function fallbackFailurePatterns(habitName) {
  return [
    `${habitName || 'This habit'} does not have enough completion history yet for a confident pattern callout.`,
    'Log a few more completions and misses across different days so the analysis can spot a real trend.',
  ];
}

function fallbackCoachingMessage(status, mode, habitName, streak) {
  if (status === 'completed') {
    return mode === 'tough'
      ? `${habitName} is done. Stack another win tomorrow and protect that ${streak}-day streak.`
      : `${habitName} is done. Nice work keeping your ${streak}-day streak moving.`;
  }

  return mode === 'tough'
    ? `You missed ${habitName}. Reset fast tomorrow before one miss turns into a pattern.`
    : `You missed ${habitName}, but the next check-in matters more than today.`;
}

async function generateInsights(habits) {
  if (habits.length === 0) {
    return generateFallbackInsights(habits);
  }

  const habitData = serializeHabitsForInsights(habits);
  const prompt = [
    'You are a habit coach.',
    'Analyse this user habit data and give 2-3 short, specific insights.',
    'Be direct. No generic advice.',
    'Return plain text only.',
    'Put each insight on its own line.',
    'Max 3 sentences per insight.',
    '',
    'Habit data (last 30 days):',
    JSON.stringify(habitData, null, 2),
  ].join('\n');

  try {
    const text = await generateGeminiText(prompt);
    const messages = normalizeLines(text, 3);
    return messages.length > 0 ? buildInsightObjects(messages) : generateFallbackInsights(habits);
  } catch (error) {
    console.error('Gemini insights error:', error.message);
    return generateFallbackInsights(habits);
  }
}

async function generateFailurePatterns({ habitName, completionHistory }) {
  const prompt = [
    'Analyse this habit completion history and identify patterns in missed days.',
    'Be specific. Name days of week, times, or sequences where skips cluster.',
    'Return 2-3 bullet points in plain text.',
    '',
    `Habit name: ${habitName || 'Unknown habit'}`,
    `Data: ${JSON.stringify(completionHistory, null, 2)}`,
  ].join('\n');

  try {
    const text = await generateGeminiText(prompt);
    const patterns = normalizeLines(text, 3);
    return patterns.length > 0 ? patterns : fallbackFailurePatterns(habitName);
  } catch (error) {
    console.error('Gemini failure pattern error:', error.message);
    return fallbackFailurePatterns(habitName);
  }
}

async function generateCoachingMessage({ habitName, status, streak, mode }) {
  const prompt = [
    `You are a habit coach in ${mode} mode.`,
    `The user just ${status} their habit: "${habitName}".`,
    `Current streak: ${streak} days.`,
    'Give ONE short coaching message.',
    'Max 20 words. No hashtags. No emojis. Plain text only.',
  ].join('\n');

  try {
    const text = await generateGeminiText(prompt);
    const [message] = normalizeLines(text, 1);
    return message || fallbackCoachingMessage(status, mode, habitName, streak);
  } catch (error) {
    console.error('Gemini coaching error:', error.message);
    return fallbackCoachingMessage(status, mode, habitName, streak);
  }
}

async function resolveInsightsHabits(req) {
  if (Array.isArray(req.body?.habits) && req.body.habits.length > 0) {
    return req.body.habits;
  }

  return Habit.find({ userId: req.userId });
}

async function handleInsights(req, res) {
  try {
    const habits = await resolveInsightsHabits(req);
    const insights = await generateInsights(habits);
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

app.get('/insights', authMiddleware, handleInsights);
app.post('/insights', authMiddleware, handleInsights);

app.post('/failure-patterns', authMiddleware, async (req, res) => {
  try {
    const { habitId, habitName, completionHistory } = req.body;
    let resolvedHabitName = habitName;
    let resolvedHistory = Array.isArray(completionHistory) ? completionHistory : [];

    if ((!resolvedHabitName || resolvedHistory.length === 0) && habitId) {
      const habit = await Habit.findOne({ _id: habitId, userId: req.userId });
      if (!habit) {
        return res.status(404).json({ error: 'Habit not found' });
      }

      resolvedHabitName = resolvedHabitName || habit.name;
      resolvedHistory = resolvedHistory.length > 0
        ? resolvedHistory
        : habit.completions.map((completion) => ({
          date: startOfDay(completion.date).toISOString().split('T')[0],
          completed: completion.completed !== false,
        }));
    }

    if (!resolvedHabitName || resolvedHistory.length === 0) {
      return res.status(400).json({ error: 'habitName and completionHistory are required' });
    }

    const patterns = await generateFailurePatterns({
      habitName: resolvedHabitName,
      completionHistory: resolvedHistory,
    });

    res.json({
      habitId: habitId || null,
      habitName: resolvedHabitName,
      patterns,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/coaching-message', authMiddleware, async (req, res) => {
  try {
    const { habitName, status, streak = 0, mode = 'supportive' } = req.body;

    if (!habitName || !status) {
      return res.status(400).json({ error: 'habitName and status are required' });
    }

    const message = await generateCoachingMessage({
      habitName,
      status,
      streak,
      mode,
    });

    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`AI Service running on port ${PORT}`);
});
