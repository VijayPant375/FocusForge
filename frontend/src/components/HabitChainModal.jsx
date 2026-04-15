import { useState } from 'react';
import { habitAPI } from '../api';
import toast from 'react-hot-toast';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HabitChainModal({ habit, habits, onClose, onSuccess }) {
  const [chainToId, setChainToId] = useState(habit.chainedTo || '');
  const [reminder, setReminder] = useState(habit.reminder || { enabled: false, time: '08:00', days: [...DAYS] });
  const [loading, setLoading] = useState(false);

  const otherHabits = habits.filter(h => h._id !== habit._id);

  const toggleDay = (day) => {
    setReminder(r => ({
      ...r,
      days: r.days.includes(day) ? r.days.filter(d => d !== day) : [...r.days, day]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await Promise.all([
        chainToId ? habitAPI.setChain(habit._id, chainToId) : habitAPI.removeChain(habit._id),
        habitAPI.setReminder(habit._id, reminder),
      ]);
      toast.success('Habit settings saved!');
      onSuccess();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-6 w-full max-w-md animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Habit Settings</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--accent-1)' }}>⚙️ {habit.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" style={{ color: 'var(--text-secondary)' }}>✕</button>
        </div>

        {/* Habit Chain */}
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>🔗 Habit Chain</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            Automatically suggest the next habit after completing this one.
          </p>
          <select
            value={chainToId}
            onChange={e => setChainToId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg outline-none transition-all appearance-none"
            style={{
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)'
            }}
          >
            <option value="">— No chain</option>
            {otherHabits.map(h => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>
          {chainToId && (
            <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-medium" style={{ color: 'var(--accent-1)' }}>{habit.name}</span>
              <span>→ then do →</span>
              <span className="font-medium" style={{ color: 'var(--accent-1)' }}>
                {otherHabits.find(h => h._id === chainToId)?.name}
              </span>
            </div>
          )}
        </div>

        {/* Reminders */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>🔔 Reminder</h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Browser push notification</p>
            </div>
            <button
              onClick={() => setReminder(r => ({ ...r, enabled: !r.enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${reminder.enabled ? 'bg-purple-500' : 'bg-gray-500/30'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${reminder.enabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {reminder.enabled && (
            <div className="space-y-3 animate-fade-in-up">
              <input
                type="time"
                value={reminder.time}
                onChange={e => setReminder(r => ({ ...r, time: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg outline-none"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  colorScheme: 'auto'
                }}
              />
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      reminder.days.includes(day)
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                        : 'border border-[var(--glass-border)] hover:bg-white/10'
                    }`}
                    style={!reminder.days.includes(day) ? { color: 'var(--text-secondary)' } : {}}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[var(--glass-border)] hover:bg-white/10 transition-colors text-sm" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 glass-button py-2 rounded-lg font-semibold text-sm">
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
