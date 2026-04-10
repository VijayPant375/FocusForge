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
        name: habit.name || '',
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
      toast.success('Habit updated! ✨');
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

  if (!habit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Habit</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
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
            <label className="block text-gray-300 text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              placeholder="e.g., Read 10 pages"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 h-24 resize-none"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
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
           <label className="block text-gray-300 text-sm font-medium mb-2">Frequency</label>
           <div className="flex space-x-4">
             <label className="flex items-center space-x-2 cursor-pointer">
               <input
                 type="radio"
                 name="frequency"
                 value="daily"
                 checked={formData.frequency === 'daily'}
                 onChange={handleChange}
                 className="text-purple-500 form-radio focus:ring-purple-500 bg-slate-700 border-slate-600"
               />
               <span className="text-gray-300">Daily</span>
             </label>
             <label className="flex items-center space-x-2 cursor-pointer">
               <input
                 type="radio"
                 name="frequency"
                 value="weekly"
                 checked={formData.frequency === 'weekly'}
                 onChange={handleChange}
                 className="text-purple-500 form-radio focus:ring-purple-500 bg-slate-700 border-slate-600"
               />
               <span className="text-gray-300">Weekly</span>
             </label>
           </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:bg-purple-600/50"
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
