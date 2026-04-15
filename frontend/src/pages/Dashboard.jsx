import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { habitAPI, analyticsAPI, aiAPI } from '../api';
import AddHabitModal from '../components/AddHabitModal';
import WeeklyChart from '../components/WeeklyChart';
import EditHabitModal from '../components/EditHabitModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

import AnimatedCounter from '../components/AnimatedCounter';
import ThemeToggle from '../components/ThemeToggle';
import SkeletonLoader from '../components/SkeletonLoader';
import HabitHeatmap from '../components/HabitHeatmap';
import RadialChart from '../components/RadialChart';
import StreakFlame from '../components/StreakFlame';
import CircularProgress from '../components/CircularProgress';

function Dashboard({ setAuth }) {
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deletingHabit, setDeletingHabit] = useState(null);
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
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#ec4899', '#38bdf8']
      });
      toast.success('Habit completed! 🎉');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error completing habit');
    }
  };

  const handleDeleteClick = (habit) => {
    setDeletingHabit(habit);
  };

  const confirmDelete = async () => {
    if (!deletingHabit) return;
    try {
      await habitAPI.delete(deletingHabit._id);
      toast.success('Habit deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error deleting habit');
    } finally {
      setDeletingHabit(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative shadow-none">
        <div className="mesh-bg"></div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <SkeletonLoader type="stat" /><SkeletonLoader type="stat" />
            <SkeletonLoader type="stat" /><SkeletonLoader type="stat" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <SkeletonLoader type="habit" /><SkeletonLoader type="habit" />
            </div>
            <SkeletonLoader type="chart" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative shadow-none">
      <div className="mesh-bg"></div>
      <nav className="glass-panel sticky top-0 z-40 mb-8 mx-6 mt-4 px-6 py-4 flex justify-between items-center transition-all animate-fade-in-up">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>FocusForge</h1>
          <div className="flex items-center gap-6">
            <span style={{ color: 'var(--text-secondary)' }} className="hidden sm:inline-block">
              Hi, <span className="font-semibold" style={{ color: 'var(--accent-1)' }}>{user.name}</span>
            </span>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg transition-colors border text-sm font-medium border-[var(--glass-border)] hover:bg-red-500/10 text-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Habits" value={stats?.totalHabits || 0} icon="🎯" />
          <StatCard title="Completed Today" value={stats?.completedToday || 0} icon="✅" />
          <StatCard title="Avg Streak" value={stats?.avgStreak || 0} icon="🔥" />
          <StatCard title="Completion Rate" value={`${stats?.completionRate || 0}%`} icon="📊" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="glass-panel p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Habits</h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="glass-button px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <span className="text-lg">+</span> Add Habit
                </button>
              </div>

              {habits.length === 0 ? (
                <p className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
                  No habits yet. Let's create your first one!
                </p>
              ) : (
                <div className="space-y-4">
                  {habits.map((habit, index) => (
                    <div 
                      key={habit._id} 
                      className="animate-fade-in-up flex" 
                      style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                    >
                      <HabitCard
                        habit={habit}
                        onComplete={handleCompleteHabit}
                        onEdit={setEditingHabit}
                        onDelete={handleDeleteClick}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Habit Heatmap */}
              <div className="mt-8 border-t border-[var(--glass-border)] pt-6">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Consistency Heatmap</h3>
                <HabitHeatmap habits={habits} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
               <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Weekly Overview</h3>
               <WeeklyChart />
            </div>
            
            <div className="glass-panel p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
               <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Category Spread</h3>
               <RadialChart habits={habits} />
            </div>

            <div className="glass-panel p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>AI Insights</h3>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="glass-card p-4 glow-on-hover">
                    <div className="flex items-start gap-3">
                      <p className="text-2xl">{insight.icon}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{insight.message}</p>
                    </div>
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

      {editingHabit && (
        <EditHabitModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSuccess={() => {
            setEditingHabit(null);
            fetchData();
          }}
        />
      )}

      {deletingHabit && (
        <DeleteConfirmModal
          itemName={deletingHabit.name}
          onCancel={() => setDeletingHabit(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  const isCompletionRate = title === "Completion Rate";
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className="flex items-center justify-between relative z-10 w-full">
        <div className="flex-1">
          <p className="text-sm mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
          <div className="mt-2">
            {isCompletionRate ? (
              <div className="flex justify-center my-2">
                <CircularProgress percentage={numValue} size={60} strokeWidth={6} />
              </div>
            ) : (
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                <AnimatedCounter value={value} />
              </p>
            )}
          </div>
        </div>
        {!isCompletionRate && (
          <div className="text-4xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">{icon}</div>
        )}
      </div>
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[var(--accent-1)] opacity-5 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"></div>
    </div>
  );
}

function HabitCard({ habit, onComplete, onEdit, onDelete }) {
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completions.some(c => 
    new Date(c.date).toISOString().split('T')[0] === today
  );

  return (
    <div className="glass-card p-4 flex items-center justify-between w-full group">
      <div className="flex-1 pr-4">
        <h4 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{habit.name}</h4>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{habit.description}</p>
        <div className="flex gap-4 mt-3">
          <span className="text-xs font-medium pl-1 pr-3 py-1 rounded-md glass-card flex items-center gap-1" style={{ color: 'var(--accent-1)' }}>
            <StreakFlame streak={habit.currentStreak} />
            <span className="mt-1">Streak: <AnimatedCounter value={habit.currentStreak} /></span>
          </span>
          <span className="text-xs font-medium px-2 py-1 rounded-md glass-card capitalize" style={{ color: 'var(--text-secondary)' }}>
            📁 {habit.category}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(habit)}
          className="p-2 transition-colors rounded-lg hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(habit)}
          className="p-2 transition-colors rounded-lg hover:bg-red-500/10 hover:text-red-500"
          style={{ color: 'var(--text-secondary)' }}
          title="Delete"
        >
          🗑️
        </button>
        <button
          onClick={() => !isCompletedToday && onComplete(habit._id)}
          disabled={isCompletedToday}
          className={`px-5 py-2 ml-2 rounded-lg transition-all font-medium ${
            isCompletedToday
              ? 'bg-green-500/20 text-green-600 dark:text-green-400 cursor-not-allowed border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
              : 'glass-button'
          }`}
        >
          {isCompletedToday ? '✓ Done' : 'Complete'}
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
