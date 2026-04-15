import { useState } from 'react';
import { habitAPI } from '../api';
import toast from 'react-hot-toast';

const MOODS = [
  { key: 'great', emoji: '😄', label: 'Great' },
  { key: 'good', emoji: '😊', label: 'Good' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
  { key: 'stressed', emoji: '😤', label: 'Stressed' },
];

export default function MoodCheckInModal({ habit, onClose, onSuccess }) {
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      onSuccess({ mood, energy });
    } finally {
      setLoading(false);
    }
  };

  const energyColor = energy <= 3 ? '#ef4444' : energy <= 6 ? '#f59e0b' : '#10b981';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-8 w-full max-w-sm animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Quick Check-in</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--accent-1)' }}>✅ {habit.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" style={{ color: 'var(--text-secondary)' }}>✕</button>
        </div>

        {/* Mood selector */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>How are you feeling?</p>
          <div className="flex justify-between gap-2">
            {MOODS.map(m => (
              <button
                key={m.key}
                onClick={() => setMood(m.key)}
                className={`flex-1 flex flex-col items-center py-3 rounded-xl border transition-all ${
                  mood === m.key
                    ? 'border-purple-500 bg-purple-500/10 scale-105'
                    : 'border-[var(--glass-border)] hover:bg-white/10'
                }`}
              >
                <span className="text-2xl mb-1">{m.emoji}</span>
                <span className="text-xs" style={{ color: mood === m.key ? '#a78bfa' : 'var(--text-secondary)' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy slider */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Energy Level</p>
            <span className="text-2xl font-bold" style={{ color: energyColor }}>{energy}<span className="text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>/10</span></span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={e => setEnergy(Number(e.target.value))}
              className="w-full h-2 appearance-none rounded-full outline-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${energyColor} ${(energy - 1) / 9 * 100}%, var(--ring-track) ${(energy - 1) / 9 * 100}%)`
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            <span>Drained</span><span>Energized</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onSuccess(null)}
            className="flex-1 py-2 rounded-lg border border-[var(--glass-border)] text-sm hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Skip check-in
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 glass-button py-2 rounded-lg font-semibold text-sm"
          >
            {loading ? 'Saving...' : 'Complete ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
