import { useState } from 'react';
import { useGamification } from '../hooks/useGamification';

const LEVEL_TITLES = {
  1: 'Beginner', 5: 'Rising Star', 10: 'Veteran',
  15: 'Committed', 20: 'Expert', 25: 'Elite',
  30: 'Master', 40: 'Grand Master', 50: 'Legend'
};

function getLevelTitle(level) {
  const thresholds = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => b - a);
  for (const t of thresholds) {
    if (level >= t) return LEVEL_TITLES[t];
  }
  return 'Beginner';
}

export function XPBar({ habits }) {
  const { xp, level, levelProgress } = useGamification(habits);
  const title = getLevelTitle(level);

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400">
          LVL {level}
        </span>
        <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>{title}</span>
      </div>
      <div className="flex-1 min-w-0 hidden md:block">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ring-track)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${levelProgress}%`, background: 'var(--accent-gradient)' }}
          />
        </div>
      </div>
      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
        {xp.toLocaleString()} XP
      </span>
    </div>
  );
}

export function BadgesPanel({ habits, onClose }) {
  const { badges } = useGamification(habits);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'unlocked' ? badges.filter(b => b.unlocked)
    : filter === 'locked' ? badges.filter(b => !b.unlocked)
    : badges;

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-6 w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-in-up">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Achievements</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {unlockedCount} / {badges.length} unlocked
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" style={{ color: 'var(--text-secondary)' }}>✕</button>
        </div>

        {/* XP Progress bar */}
        <XPBar habits={habits} />

        {/* Filter tabs */}
        <div className="flex gap-2 my-4">
          {['all', 'unlocked', 'locked'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`capitalize text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${filter === f ? 'glass-button' : 'border border-[var(--glass-border)] hover:bg-white/10'}`} style={filter !== f ? { color: 'var(--text-secondary)' } : {}}>
              {f}
            </button>
          ))}
        </div>

        {/* Badge grid */}
        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(badge => (
              <div
                key={badge.id}
                className={`glass-card p-4 flex items-center gap-3 transition-all ${badge.unlocked ? '' : 'opacity-40 grayscale'}`}
              >
                <span className="text-3xl flex-shrink-0">{badge.icon}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: badge.unlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {badge.name}
                    {badge.unlocked && <span className="ml-1 text-green-400">✓</span>}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
