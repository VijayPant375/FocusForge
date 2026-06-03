/**
 * seedDemo.js — Seed the FocusForge demo account
 *
 * Creates/recreates:
 *   - User: demo@focusforge.app / demo1234 (name: DemoUser)
 *   - 5 habits with 30 days of completion history
 *
 * Uses the same MONGODB_URI from habit-service/.env
 *
 * Run: node scripts/seedDemo.js
 * Or:  npm run seed:demo (from project root)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './habit-service/.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found. Make sure habit-service/.env exists with MONGODB_URI set.');
  process.exit(1);
}

// ── Inline schemas (match the actual service schemas exactly) ──────────────

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const habitSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: {
    type: String,
    enum: ['health', 'productivity', 'mindfulness', 'learning', 'fitness', 'other'],
    default: 'other',
  },
  frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  chainedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', default: null },
  reminder: {
    enabled: { type: Boolean, default: false },
    time: { type: String, default: '08:00' },
    days: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  },
  completions: [{
    date: { type: Date, required: true },
    completed: { type: Boolean, default: true },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'tired', 'stressed', null],
      default: null,
    },
    energy: { type: Number, min: 1, max: 10, default: null },
  }],
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Register models on a fresh connection (avoid OverwriteModelError)
const User = mongoose.model('User', userSchema);
const Habit = mongoose.model('Habit', habitSchema);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a Date object for `daysAgo` days before today at midnight UTC */
function daysAgo(n) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

/** Day-of-week: 0=Sun, 1=Mon, ..., 6=Sat */
function dow(date) {
  return date.getUTCDay();
}

/**
 * Build 30-day completion array for a habit using a skip predicate.
 * `skipFn(date, dayIndex)` → true means skip that day (not completed)
 */
function buildCompletions(skipFn) {
  const completions = [];
  for (let i = 29; i >= 0; i--) {
    const date = daysAgo(i);
    if (!skipFn(date, i)) {
      completions.push({ date, completed: true });
    }
  }
  return completions;
}

// ── Habit definitions ─────────────────────────────────────────────────────────
// Completion patterns match the plan exactly so Gemini can detect them.

const HABIT_TEMPLATES = [
  {
    name: 'Morning Run',
    category: 'fitness',
    description: 'Get the day started with a morning run',
    // Skip every Monday (dow=1) and every Saturday (dow=6)
    skipFn: (date) => dow(date) === 1 || dow(date) === 6,
  },
  {
    name: 'Read 30 Mins',
    category: 'learning',
    description: 'Read for 30 minutes to keep growing',
    // Completed every day — no skips
    skipFn: () => false,
  },
  {
    name: 'Drink Water',
    category: 'health',
    description: 'Stay hydrated throughout the day',
    // Completed every day — no skips
    skipFn: () => false,
  },
  {
    name: 'Meditate',
    category: 'mindfulness',
    description: 'Daily meditation for mental clarity',
    // Skip days 5, 10, 15, 20, 25 (roughly weekly gaps)
    // dayIndex counts from 0 (today) to 29 (30 days ago); we want skips at days-ago 5,10,15,20,25
    skipFn: (_, i) => [5, 10, 15, 20, 25].includes(i),
  },
  {
    name: 'Evening Stretch',
    category: 'fitness',
    description: 'Wind down with an evening stretching routine',
    // Only on weekdays (Mon–Fri), always skip weekends (Sat=6, Sun=0)
    skipFn: (date) => dow(date) === 0 || dow(date) === 6,
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  // 1. Delete existing demo user
  const existingUser = await User.findOne({ email: 'demo@focusforge.app' });
  if (existingUser) {
    console.log(`🗑️  Deleting existing demo user (${existingUser._id}) and their habits...`);
    await Habit.deleteMany({ userId: existingUser._id.toString() });
    await User.deleteOne({ _id: existingUser._id });
    console.log('   Done.');
  }

  // 2. Create demo user with hashed password
  console.log('👤 Creating demo user...');
  const hashedPassword = await bcrypt.hash('demo1234', 10);
  const demoUser = await User.create({
    name: 'DemoUser',
    email: 'demo@focusforge.app',
    password: hashedPassword,
  });
  console.log(`   Created: ${demoUser.email} (${demoUser._id})`);

  // 3. Create 5 habits with 30-day completion history
  console.log('📋 Creating habits with 30 days of history...');
  for (const template of HABIT_TEMPLATES) {
    const completions = buildCompletions(template.skipFn);
    const habit = await Habit.create({
      userId: demoUser._id.toString(),
      name: template.name,
      category: template.category,
      description: template.description,
      frequency: 'daily',
      completions,
    });
    console.log(`   ✓ ${habit.name} — ${completions.length} completions out of 30 days`);
  }

  console.log('\n✅ Demo seed complete!');
  console.log('─────────────────────────────────────────');
  console.log('  Email:    demo@focusforge.app');
  console.log('  Password: demo1234');
  console.log('─────────────────────────────────────────');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
