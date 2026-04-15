import { useMemo } from 'react';

// Compute XP and level from habits data
export function computeGamification(habits) {
  let xp = 0;
  const badges = [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const currentHour = now.getHours();

  const totalCompletions = habits.reduce((sum, h) => sum + h.completions.length, 0);
  const maxStreak = Math.max(0, ...habits.map(h => h.currentStreak));
  const longestStreak = Math.max(0, ...habits.map(h => h.longestStreak));
  const todayCompletions = habits.filter(h =>
    h.completions.some(c => new Date(c.date).toISOString().split('T')[0] === today)
  );
  const allDoneToday = habits.length > 0 && todayCompletions.length === habits.length;

  // XP: 100 per completion + streak bonuses + perfect day bonus
  xp += totalCompletions * 100;
  xp += longestStreak * 50;
  if (allDoneToday) xp += 500;
  xp += habits.length * 200; // just for having habits

  // Categories
  const categoryCount = habits.reduce((acc, h) => {
    acc[h.category] = (acc[h.category] || 0) + 1;
    return acc;
  }, {});

  // === Define all 20+ badges ===
  const allBadges = [
    { id: 'first_habit', name: 'First Step', desc: 'Create your first habit', icon: '🌱', unlocked: habits.length >= 1 },
    { id: 'five_habits', name: 'Habit Collector', desc: 'Create 5 habits', icon: '📌', unlocked: habits.length >= 5 },
    { id: 'ten_habits', name: 'Habit Master', desc: 'Create 10 habits', icon: '🏆', unlocked: habits.length >= 10 },
    { id: 'first_complete', name: 'Initiator', desc: 'Complete a habit for the first time', icon: '⚡', unlocked: totalCompletions >= 1 },
    { id: 'ten_completions', name: 'Getting Momentum', desc: '10 total completions', icon: '🔄', unlocked: totalCompletions >= 10 },
    { id: '50_completions', name: 'On Fire', desc: '50 total completions', icon: '🔥', unlocked: totalCompletions >= 50 },
    { id: '100_completions', name: 'Centurion', desc: '100 total completions', icon: '💯', unlocked: totalCompletions >= 100 },
    { id: 'streak_3', name: '3-Day Streak', desc: 'Maintain a 3-day streak', icon: '📅', unlocked: maxStreak >= 3 },
    { id: 'streak_7', name: '7-Day Warrior', desc: 'Maintain a 7-day streak', icon: '⚔️', unlocked: longestStreak >= 7 },
    { id: 'streak_21', name: 'Consistency King', desc: '21-day streak achieved', icon: '👑', unlocked: longestStreak >= 21 },
    { id: 'streak_30', name: '30-Day Champion', desc: '30-day streak legend', icon: '🥇', unlocked: longestStreak >= 30 },
    { id: 'streak_100', name: '100-Day Legend', desc: '100-day streak — incredible!', icon: '🦅', unlocked: longestStreak >= 100 },
    { id: 'perfect_day', name: 'Perfect Day', desc: 'Complete all habits in one day', icon: '✨', unlocked: allDoneToday },
    { id: 'category_master_health', name: 'Health Guardian', desc: '3+ health habits', icon: '❤️', unlocked: (categoryCount['health'] || 0) >= 3 },
    { id: 'category_master_fitness', name: 'Fitness Freak', desc: '3+ fitness habits', icon: '💪', unlocked: (categoryCount['fitness'] || 0) >= 3 },
    { id: 'category_master_mind', name: 'Zen Master', desc: '3+ mindfulness habits', icon: '🧘', unlocked: (categoryCount['mindfulness'] || 0) >= 3 },
    { id: 'category_master_learn', name: 'Scholar', desc: '3+ learning habits', icon: '📖', unlocked: (categoryCount['learning'] || 0) >= 3 },
    { id: 'weekend_warrior', name: 'Weekend Warrior', desc: 'Complete habits on a weekend', icon: '🎉', unlocked: isWeekend && todayCompletions.length > 0 },
    { id: 'level_5', name: 'Rising Star', desc: 'Reach Level 5', icon: '⭐', unlocked: xp >= getXPForLevel(5) },
    { id: 'level_10', name: 'Veteran', desc: 'Reach Level 10', icon: '🌟', unlocked: xp >= getXPForLevel(10) },
    { id: 'level_25', name: 'Elite', desc: 'Reach Level 25', icon: '💎', unlocked: xp >= getXPForLevel(25) },
    { id: 'diversified', name: 'Well-Rounded', desc: 'Habits in 4+ different categories', icon: '🌐', unlocked: Object.keys(categoryCount).length >= 4 },
  ];

  const level = getLevel(xp);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const levelProgress = Math.min(100, Math.round(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100));

  return { xp, level, levelProgress, currentLevelXP, nextLevelXP, badges: allBadges, todayCompletions };
}

function getXPForLevel(level) {
  // Quadratic XP curve
  return Math.round(1000 * Math.pow(level - 1, 1.8));
}

function getLevel(xp) {
  let level = 1;
  while (getXPForLevel(level + 1) <= xp && level < 50) level++;
  return level;
}

export function useGamification(habits) {
  return useMemo(() => computeGamification(habits || []), [habits]);
}
