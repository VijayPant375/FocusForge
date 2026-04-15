import { useState, useEffect } from 'react';
import { habitAPI } from '../api';
import toast from 'react-hot-toast';

function EditHabitModal({ habit, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'health',
    frequency: 'daily'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name,
        description: habit.description || '',
        category: habit.category || 'health',
        frequency: habit.frequency || 'daily'
      });
    }
  }, [habit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Habit name is required');
      return;
    }

    setLoading(true);
    try {
      await habitAPI.update(habit._id, formData);
      toast.success('Habit updated successfully!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update habit');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-panel p-8 w-full max-w-md animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Edit Habit</h2>
          <button onClick={onClose} className="p-2 transition-colors hover:bg-white/10 rounded-full" style={{ color: 'var(--text-secondary)' }}>
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg outline-none transition-all glow-border"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg outline-none transition-all glow-border h-24 resize-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-lg outline-none transition-all glow-border appearance-none"
              style={{ color: 'var(--text-primary)' }}
             >
              <option value="health">Health</option>
              <option value="productivity">Productivity</option>
              <option value="mindfulness">Mindfulness</option>
              <option value="learning">Learning</option>
              <option value="fitness">Fitness</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
           <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Frequency</label>
           <div className="flex space-x-6">
             <label className="flex items-center space-x-2 cursor-pointer">
               <input
                 type="radio"
                 name="frequency"
                 value="daily"
                 checked={formData.frequency === 'daily'}
                 onChange={handleChange}
                 className="text-[var(--accent-1)] focus:ring-[var(--accent-1)]"
               />
               <span style={{ color: 'var(--text-secondary)' }}>Daily</span>
             </label>
             <label className="flex items-center space-x-2 cursor-pointer">
               <input
                 type="radio"
                 name="frequency"
                 value="weekly"
                 checked={formData.frequency === 'weekly'}
                 onChange={handleChange}
                 className="text-[var(--accent-1)] focus:ring-[var(--accent-1)]"
               />
               <span style={{ color: 'var(--text-secondary)' }}>Weekly</span>
             </label>
           </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg transition-colors border border-[var(--glass-border)] hover:bg-white/10"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="glass-button px-5 py-2 rounded-lg font-medium"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
       </form>
      </div>
    </div>
  );
}

export default EditHabitModal;
