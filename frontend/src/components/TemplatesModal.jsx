import { useState } from 'react';
import { habitAPI } from '../api';
import toast from 'react-hot-toast';

const TEMPLATES = {
  '💪 Fitness Bundle': [
    { name: 'Morning Run', description: '30 minute jog to start the day', category: 'fitness', frequency: 'daily' },
    { name: 'Full Body Stretch', description: '10 minutes of stretching & mobility', category: 'fitness', frequency: 'daily' },
    { name: '10,000 Steps', description: 'Hit 10k steps throughout the day', category: 'fitness', frequency: 'daily' },
    { name: 'Evening Workout', description: '45 min gym or home workout', category: 'fitness', frequency: 'daily' },
  ],
  '📚 Learning Bundle': [
    { name: 'Read 30 Minutes', description: 'Read a non-fiction or skill book', category: 'learning', frequency: 'daily' },
    { name: 'Duolingo Lesson', description: 'Complete one Duolingo language lesson', category: 'learning', frequency: 'daily' },
    { name: 'Watch Tutorial', description: 'Watch one educational video or course', category: 'learning', frequency: 'daily' },
    { name: 'Practice Coding', description: '1 LeetCode problem or side project work', category: 'productivity', frequency: 'daily' },
  ],
  '🥗 Health Bundle': [
    { name: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day', category: 'health', frequency: 'daily' },
    { name: 'Take Vitamins', description: 'Daily vitamins & supplements', category: 'health', frequency: 'daily' },
    { name: 'Sleep 8 Hours', description: 'Aim for 8 hours of quality sleep', category: 'health', frequency: 'daily' },
    { name: 'Eat Vegetables', description: 'Include vegetables in every meal', category: 'health', frequency: 'daily' },
  ],
  '🧘 Mindfulness Bundle': [
    { name: 'Morning Meditation', description: '10 minutes of mindfulness meditation', category: 'mindfulness', frequency: 'daily' },
    { name: 'Gratitude Journal', description: 'Write 3 things you are grateful for', category: 'mindfulness', frequency: 'daily' },
    { name: 'Deep Breathing', description: '5 minutes of breathing exercises', category: 'mindfulness', frequency: 'daily' },
    { name: 'Digital Detox Hour', description: '1 hour without screens before bed', category: 'mindfulness', frequency: 'daily' },
  ],
  '🚀 Productivity Bundle': [
    { name: 'Plan Your Day', description: 'Write out 3 top priorities each morning', category: 'productivity', frequency: 'daily' },
    { name: 'Deep Work Block', description: '2 hours of focused, distraction-free work', category: 'productivity', frequency: 'daily' },
    { name: 'Inbox Zero', description: 'Clear your email inbox', category: 'productivity', frequency: 'daily' },
    { name: 'Weekly Review', description: 'Review goals and plan next week on Sunday', category: 'productivity', frequency: 'weekly' },
  ],
};

const CATEGORY_COLORS = {
  fitness: '#f97316',
  learning: '#38bdf8',
  health: '#10b981',
  mindfulness: '#a78bfa',
  productivity: '#ec4899',
  other: '#94a3b8',
};

export default function TemplatesModal({ onClose, onSuccess }) {
  const [importing, setImporting] = useState(null);
  const [imported, setImported] = useState(new Set());

  const handleImport = async (bundleName) => {
    setImporting(bundleName);
    const habits = TEMPLATES[bundleName];
    try {
      await Promise.all(habits.map(h => habitAPI.create(h)));
      toast.success(`${bundleName} imported! (${habits.length} habits added)`);
      setImported(prev => new Set([...prev, bundleName]));
      onSuccess();
    } catch (err) {
      toast.error('Failed to import some habits');
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Habit Templates</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Import a full bundle instantly</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" style={{ color: 'var(--text-secondary)' }}>✕</button>
        </div>

        <div className="space-y-4">
          {Object.entries(TEMPLATES).map(([bundleName, habits]) => {
            const isImporting = importing === bundleName;
            const isImported = imported.has(bundleName);
            return (
              <div key={bundleName} className="glass-card p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{bundleName}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{habits.length} habits</p>
                  </div>
                  <button
                    onClick={() => !isImported && handleImport(bundleName)}
                    disabled={isImporting || isImported}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isImported
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                        : isImporting
                        ? 'opacity-60 cursor-wait glass-button'
                        : 'glass-button'
                    }`}
                  >
                    {isImported ? '✓ Imported' : isImporting ? 'Importing...' : '+ Import Bundle'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {habits.map((h, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[h.category]}20`,
                        color: CATEGORY_COLORS[h.category],
                        border: `1px solid ${CATEGORY_COLORS[h.category]}40`,
                      }}
                    >
                      {h.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--text-secondary)' }}>
          Community templates coming soon 🚀
        </p>
      </div>
    </div>
  );
}
