import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { habitAPI, analyticsAPI, aiAPI } from '../api';
import AddHabitModal from '../components/AddHabitModal';

function Dashboard({ setAuth }) {
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [habitsRes, statsRes, insightsRes] = await Promise.all([
        habitAPI.getAll(),
        analyticsAPI.getStats(),
        aiAPI.getInsights()
      ]);
      
      setHabits(habitsRes.data.habits);
      setStats(statsRes.data);
      setInsights(insightsRes.data.insights);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(false);
    navigate('/login');
  };

  const handleCompleteHabit = async (habitId) => {
    try {
      await habitAPI.complete(habitId);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error completing habit');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Smart Habit Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Hi, {user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Habits" value={stats?.totalHabits || 0} icon="🎯" />
          <StatCard title="Completed Today" value={stats?.completedToday || 0} icon="✅" />
          <StatCard title="Avg Streak" value={stats?.avgStreak || 0} icon="🔥" />
          <StatCard title="Completion Rate" value={`${stats?.completionRate || 0}%`} icon="📊" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Your Habits</h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
                >
                  + Add Habit
                </button>
              </div>

              {habits.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No habits yet. Create your first one!</p>
              ) : (
                <div className="space-y-4">
                  {habits.map(habit => (
                    <HabitCard
                      key={habit._id}
                      habit={habit}
                      onComplete={handleCompleteHabit}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">AI Insights</h3>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-2xl mb-2">{insight.icon}</p>
                    <p className="text-gray-300 text-sm">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddHabitModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function HabitCard({ habit, onComplete }) {
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completions.some(c => 
    new Date(c.date).toISOString().split('T')[0] === today
  );

  return (
    <div className="bg-slate-700 p-4 rounded-lg flex items-center justify-between">
      <div className="flex-1">
        <h4 className="text-white font-semibold text-lg">{habit.name}</h4>
        <p className="text-gray-400 text-sm">{habit.description}</p>
        <div className="flex gap-4 mt-2">
          <span className="text-sm text-gray-300">🔥 Streak: {habit.currentStreak} days</span>
          <span className="text-sm text-gray-300 capitalize">📁 {habit.category}</span>
        </div>
      </div>
      <button
        onClick={() => !isCompletedToday && onComplete(habit._id)}
        disabled={isCompletedToday}
        className={`px-6 py-2 rounded-lg transition ${
          isCompletedToday
            ? 'bg-green-500 text-white cursor-not-allowed'
            : 'bg-primary hover:bg-purple-600 text-white'
        }`}
      >
        {isCompletedToday ? '✓ Done' : 'Complete'}
      </button>
    </div>
  );
}

export default Dashboard;
