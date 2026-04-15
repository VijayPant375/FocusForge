import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { habitAPI, analyticsAPI, aiAPI } from '../api';
import AddHabitModal from '../components/AddHabitModal';
import WeeklyChart from '../components/WeeklyChart';
import EditHabitModal from '../components/EditHabitModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

// Phase 1
import AnimatedCounter from '../components/AnimatedCounter';
import ThemeToggle from '../components/ThemeToggle';
import SkeletonLoader from '../components/SkeletonLoader';
import HabitHeatmap from '../components/HabitHeatmap';
import RadialChart from '../components/RadialChart';
import StreakFlame from '../components/StreakFlame';
import CircularProgress from '../components/CircularProgress';

// Phase 2
import PomodoroTimer from '../components/PomodoroTimer';
import MoodCheckInModal from '../components/MoodCheckInModal';
import TemplatesModal from '../components/TemplatesModal';
import HabitChainModal from '../components/HabitChainModal';
import { BadgesPanel, XPBar } from '../components/GamificationUI';
import { VoiceMicButton } from '../components/VoiceCommands';
import ShareCardModal from '../components/ShareCardModal';

function Dashboard({ setAuth }) {
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals - Phase 1
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deletingHabit, setDeletingHabit] = useState(null);

  // Modals - Phase 2
  const [pomodoroHabit, setPomodoroHabit] = useState(null);
  const [moodHabit, setMoodHabit] = useState(null);
  const [chainHabit, setChainHabit] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [chainSuggestion, setChainSuggestion] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { fetchData(); }, []);

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

  // Phase 2: Mood check-in before completing
  const handleCompleteClick = (habit) => {
    setMoodHabit(habit);
  };

  const handleCompleteWithMood = async (habitId, moodData) => {
    try {
      const res = await habitAPI.complete(habitId, moodData);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#8b5cf6', '#ec4899', '#38bdf8'] });
      toast.success('Habit completed! 🎉');
      fetchData();
      // Chain suggestion
      if (res.data?.chainedHabit) {
        setChainSuggestion(res.data.chainedHabit);
        setTimeout(() => setChainSuggestion(null), 6000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error completing habit');
    }
  };

  const handleDeleteClick = (habit) => setDeletingHabit(habit);

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
      <div className="min-h-screen relative">
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
            <SkeletonLoader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="mesh-bg"></div>

      {/* Navbar */}
      <nav className="glass-panel sticky top-0 z-40 mb-6 mx-4 mt-3 px-5 py-3 flex items-center gap-3 animate-fade-in-up">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h1 className="text-xl font-bold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>⚡ FocusForge</h1>
          <div className="flex-1 min-w-0 hidden lg:block">
            <XPBar habits={habits} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
            Hi, <span className="font-semibold" style={{ color: 'var(--accent-1)' }}>{user.name}</span>
          </span>
          <button onClick={() => setShowBadges(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-lg" title="Achievements">🏆</button>
          <button onClick={() => setShowShare(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-lg" title="Share">📤</button>
          <ThemeToggle />
          <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg border text-xs font-medium border-[var(--glass-border)] hover:bg-red-500/10 text-red-500 transition-colors">
            Logout
          </button>
        </div>
      </nav>

      {/* Chain suggestion toast */}
      {chainSuggestion && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-30 animate-fade-in-up">
          <div className="glass-panel px-5 py-3 flex items-center gap-3 shadow-lg border border-purple-500/30">
            <span>🔗</span>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              Next up: <strong style={{ color: 'var(--accent-1)' }}>{chainSuggestion.name}</strong>
            </p>
            <button
              onClick={() => handleCompleteClick(chainSuggestion)}
              className="glass-button text-xs px-3 py-1 rounded-lg"
            >
              Do it now
            </button>
            <button onClick={() => setChainSuggestion(null)} className="text-sm" style={{ color: 'var(--text-secondary)' }}>✕</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Habits" value={stats?.totalHabits || 0} icon="🎯" />
          <StatCard title="Completed Today" value={stats?.completedToday || 0} icon="✅" />
          <StatCard title="Avg Streak" value={stats?.avgStreak || 0} icon="🔥" />
          <StatCard title="Completion Rate" value={stats?.completionRate || 0} icon="📊" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Habits panel */}
          <div className="lg:col-span-2">
            <div className="glass-panel p-5">
              <div className="flex flex-wrap justify-between items-center mb-5 gap-2">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Habits</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowTemplates(true)} className="px-3 py-1.5 rounded-lg border border-[var(--glass-border)] hover:bg-white/10 transition-colors text-sm flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    📋 Templates
                  </button>
                  <button onClick={() => setShowAddModal(true)} className="glass-button px-4 py-1.5 rounded-lg text-sm flex items-center gap-1">
                    + Add Habit
                  </button>
                </div>
              </div>

              {habits.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🌱</p>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No habits yet</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Create your first habit or import a template bundle</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {habits.map((habit, index) => (
                    <div key={habit._id} className="animate-fade-in-up" style={{ animationDelay: `${0.08 * index}s` }}>
                      <HabitCard
                        habit={habit}
                        habits={habits}
                        onComplete={() => handleCompleteClick(habit)}
                        onEdit={setEditingHabit}
                        onDelete={handleDeleteClick}
                        onTimer={() => setPomodoroHabit(habit)}
                        onChain={() => setChainHabit(habit)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Heatmap */}
              {habits.length > 0 && (
                <div className="mt-6 border-t pt-5" style={{ borderColor: 'var(--glass-border)' }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Consistency Heatmap</h3>
                  <HabitHeatmap habits={habits} />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="glass-panel p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Weekly Overview</h3>
              <WeeklyChart />
            </div>

            <div className="glass-panel p-5 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              <h3 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Category Spread</h3>
              <RadialChart habits={habits} />
            </div>

            <div className="glass-panel p-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>AI Insights</h3>
              <div className="space-y-2">
                {insights.map((insight, index) => (
                  <div key={index} className="glass-card p-3 flex items-start gap-3">
                    <p className="text-xl flex-shrink-0">{insight.icon}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2: Voice Mic Button */}
      <VoiceMicButton
        habits={habits}
        onRefresh={fetchData}
        onShowStats={() => setShowBadges(true)}
      />

      {/* All Modals */}
      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchData(); }} />}
      {editingHabit && <EditHabitModal habit={editingHabit} onClose={() => setEditingHabit(null)} onSuccess={() => { setEditingHabit(null); fetchData(); }} />}
      {deletingHabit && <DeleteConfirmModal itemName={deletingHabit.name} onCancel={() => setDeletingHabit(null)} onConfirm={confirmDelete} />}
      {moodHabit && <MoodCheckInModal habit={moodHabit} onClose={() => setMoodHabit(null)} onSuccess={(moodData) => { const h = moodHabit; setMoodHabit(null); handleCompleteWithMood(h._id, moodData || {}); }} />}
      {pomodoroHabit && <PomodoroTimer habitName={pomodoroHabit.name} onClose={() => setPomodoroHabit(null)} />}
      {showTemplates && <TemplatesModal onClose={() => setShowTemplates(false)} onSuccess={() => { setShowTemplates(false); fetchData(); }} />}
      {chainHabit && <HabitChainModal habit={chainHabit} habits={habits} onClose={() => setChainHabit(null)} onSuccess={() => { setChainHabit(null); fetchData(); }} />}
      {showBadges && <BadgesPanel habits={habits} onClose={() => setShowBadges(false)} />}
      {showShare && <ShareCardModal habits={habits} stats={stats} onClose={() => setShowShare(false)} />}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  const isCompletionRate = title === 'Completion Rate';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      <div className="flex items-center justify-between relative z-10 w-full">
        <div className="flex-1">
          <p className="text-xs mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
          <div className="mt-1">
            {isCompletionRate ? (
              <div className="flex justify-center my-1">
                <CircularProgress percentage={numValue} size={56} strokeWidth={6} />
              </div>
            ) : (
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                <AnimatedCounter value={value} />
              </p>
            )}
          </div>
        </div>
        {!isCompletionRate && (
          <div className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">{icon}</div>
        )}
      </div>
      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[var(--accent-1)] opacity-5 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"></div>
    </div>
  );
}

function HabitCard({ habit, habits, onComplete, onEdit, onDelete, onTimer, onChain }) {
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completions.some(c =>
    new Date(c.date).toISOString().split('T')[0] === today
  );
  const chainedName = habit.chainedTo ? habits.find(h => h._id === habit.chainedTo)?._name : null;

  return (
    <div className="glass-card p-4 group w-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{habit.name}</h4>
            {habit.chainedTo && <span className="text-xs px-1.5 py-0.5 rounded-md text-purple-400 bg-purple-500/10 border border-purple-500/20 flex-shrink-0">🔗 Chained</span>}
            {habit.reminder?.enabled && <span className="text-xs px-1.5 py-0.5 rounded-md text-blue-400 bg-blue-500/10 border border-blue-500/20 flex-shrink-0">🔔 {habit.reminder.time}</span>}
          </div>
          {habit.description && <p className="text-xs mb-2 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{habit.description}</p>}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-md glass-card flex items-center gap-1" style={{ color: 'var(--accent-1)' }}>
              <StreakFlame streak={habit.currentStreak} />
              <span>{habit.currentStreak}d streak</span>
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md glass-card capitalize" style={{ color: 'var(--text-secondary)' }}>
              {habit.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onTimer} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-sm" title="Pomodoro Timer" style={{ color: 'var(--text-secondary)' }}>⏱</button>
          <button onClick={onChain} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-sm" title="Chain & Reminder" style={{ color: 'var(--text-secondary)' }}>⚙️</button>
          <button onClick={() => onEdit(habit)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-sm" title="Edit" style={{ color: 'var(--text-secondary)' }}>✏️</button>
          <button onClick={() => onDelete(habit)} className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors text-sm" title="Delete" style={{ color: 'var(--text-secondary)' }}>🗑️</button>
          <button
            onClick={() => !isCompletedToday && onComplete(habit._id)}
            disabled={isCompletedToday}
            className={`ml-1 px-4 py-1.5 rounded-lg transition-all font-medium text-sm ${
              isCompletedToday
                ? 'bg-green-500/20 text-green-500 cursor-not-allowed border border-green-500/30'
                : 'glass-button'
            }`}
          >
            {isCompletedToday ? '✓ Done' : 'Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
