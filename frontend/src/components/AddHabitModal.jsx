import { useState } from 'react';
import { habitAPI } from '../api';
import toast from 'react-hot-toast';

// Preset emoji options for the habit icon picker
const EMOJI_OPTIONS = ['🏃', '📖', '💪', '🧘', '💧', '🥗', '✍️', '🎯', '🌅', '🎵'];

// Category options with brand colors
const CATEGORIES = [
  { value: 'health',       label: 'Health',       color: 'bg-brand-green',  ring: 'ring-brand-green' },
  { value: 'fitness',      label: 'Fitness',      color: 'bg-brand-orange', ring: 'ring-brand-orange' },
  { value: 'mindfulness',  label: 'Mindfulness',  color: 'bg-brand-blue',   ring: 'ring-brand-blue' },
  { value: 'learning',     label: 'Learning',     color: 'bg-brand-yellow', ring: 'ring-brand-yellow' },
  { value: 'productivity', label: 'Productivity', color: 'bg-brand-purple', ring: 'ring-brand-purple' },
  { value: 'other',        label: 'Other',        color: 'bg-brand-pink',   ring: 'ring-brand-pink' },
];

function AddHabitModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'health',
    frequency: 'daily',
  });
  const [selectedEmoji, setSelectedEmoji] = useState('🏃');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Logic unchanged ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Habit name is required');
      return;
    }

    setLoading(true);
    try {
      await habitAPI.create({ ...formData, icon: selectedEmoji });
      toast.success('Habit created successfully! 🌱');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  // ─────────────────────────────────────────────────────────────────────────

  const selectedCategory = CATEGORIES.find((c) => c.value === formData.category) || CATEGORIES[0];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4 animate-fade-in-up">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Habit</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Emoji picker */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pick an icon
          </label>
          <div className="flex gap-2 flex-wrap">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110 ${
                  selectedEmoji === emoji
                    ? 'bg-brand-purple/10 ring-2 ring-brand-purple scale-110'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Habit name
            </label>
            <input
              type="text"
              name="name"
              id="add-habit-name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple transition"
              placeholder="e.g., Read 10 pages"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="description"
              id="add-habit-description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple transition h-20 resize-none"
              placeholder="Why does this habit matter to you?"
            />
          </div>

          {/* Category — colored circle selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category —{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedCategory.label}
              </span>
            </label>
            <div className="flex gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  title={cat.label}
                  className={`w-8 h-8 rounded-full ${cat.color} transition-all hover:scale-110 ${
                    formData.category === cat.value
                      ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ${cat.ring} scale-110`
                      : 'opacity-50 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
            {/* Hidden select kept for form name/value compatibility */}
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="sr-only"
              tabIndex={-1}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frequency
            </label>
            <div className="flex gap-3">
              {['daily', 'weekly'].map((freq) => (
                <label
                  key={freq}
                  className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border-2 cursor-pointer transition-all capitalize font-medium text-sm ${
                    formData.frequency === freq
                      ? 'border-brand-purple bg-brand-purple/10 text-brand-purple'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={freq}
                    checked={formData.frequency === freq}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {freq === 'daily' ? '📅 Daily' : '📆 Weekly'}
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="add-habit-submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Saving...
                </span>
              ) : '+ Add Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddHabitModal;
