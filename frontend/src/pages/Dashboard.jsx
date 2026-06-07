import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { habitAPI, analyticsAPI, aiAPI, notificationAPI, authAPI } from '../api';
import { Bell } from 'lucide-react';
import AddHabitModal from '../components/AddHabitModal';
import WeeklyChart from '../components/WeeklyChart';
import EditHabitModal from '../components/EditHabitModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import WeeklyReviewModal from '../components/WeeklyReviewModal';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { enqueue } from '../utils/offlineQueue';

import AnimatedCounter from '../components/AnimatedCounter';
import ThemeToggle from '../components/ThemeToggle';
import SkeletonLoader from '../components/SkeletonLoader';
import HabitHeatmap from '../components/HabitHeatmap';
import RadialChart from '../components/RadialChart';
import StreakFlame from '../components/StreakFlame';
import CircularProgress from '../components/CircularProgress';

import PomodoroTimer from '../components/PomodoroTimer';
import MoodCheckInModal from '../components/MoodCheckInModal';
import TemplatesModal from '../components/TemplatesModal';
import HabitChainModal from '../components/HabitChainModal';
import { BadgesPanel, XPBar } from '../components/GamificationUI'; // XPBar moved to dashboard body in Phase 3
import { useGamification, computeGamification } from '../hooks/useGamification';

import { VoiceMicButton } from '../components/VoiceCommands';
import ShareCardModal from '../components/ShareCardModal';

function Dashboard({ setAuth }) {
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [failurePatterns, setFailurePatterns] = useState([]);
  const [failurePatternHabit, setFailurePatternHabit] = useState('');
  const [failurePatternsLoading, setFailurePatternsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [freezeTokens, setFreezeTokens] = useState(0);

  const [archivedHabits, setArchivedHabits] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deletingHabit, setDeletingHabit] = useState(null);

  const [pomodoroHabit, setPomodoroHabit] = useState(null);
  const [moodHabit, setMoodHabit] = useState(null);
  const [chainHabit, setChainHabit] = useState(null);
  const [chainSuggestion, setChainSuggestion] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isDemo = user?.email === 'demo@focusforge.app';
  const [demoBannerDismissed, setDemoBannerDismissed] = useState(() =>
    sessionStorage.getItem('demo_banner_dismissed') === 'true'
  );

  const handleDismissDemoBanner = () => {
    sessionStorage.setItem('demo_banner_dismissed', 'true');
    setDemoBannerDismissed(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getFailurePatternTarget = (habitList) => {
    const withHistory = habitList.filter((habit) => Array.isArray(habit.completions) && habit.completions.length > 0);
    if (withHistory.length === 0) {
      return null;
    }

    return [...withHistory].sort((a, b) => {
      const completionDiff = b.completions.length - a.completions.length;
      if (completionDiff !== 0) {
        return completionDiff;
      }

      return (a.currentStreak || 0) - (b.currentStreak || 0);
    })[0];
  };

  const fetchFailurePatterns = async (habitList) => {
    const targetHabit = getFailurePatternTarget(habitList);
    if (!targetHabit) {
      setFailurePatterns([]);
      setFailurePatternHabit('');
      return;
    }

    setFailurePatternsLoading(true);

    try {
      const response = await aiAPI.getFailurePatterns({
        habitId: targetHabit._id,
        habitName: targetHabit.name,
        completionHistory: targetHabit.completions.map((completion) => ({
          date: new Date(completion.date).toISOString().split('T')[0],
          completed: completion.completed !== false,
        })),
      });

      setFailurePatterns(response.data.patterns || []);
      setFailurePatternHabit(response.data.habitName || targetHabit.name);
    } catch (error) {
      console.error('Error fetching failure patterns:', error);
      setFailurePatterns([]);
      setFailurePatternHabit(targetHabit.name);
    } finally {
      setFailurePatternsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [habitsRes, statsRes, insightsRes, profileRes] = await Promise.all([
        habitAPI.getAll().catch(e => { console.error('Habit fetch error:', e); return { data: { habits: null } }; }),
        analyticsAPI.getStats().catch(e => { console.error('Stats fetch error:', e); return { data: null }; }),
        aiAPI.getInsights().catch(e => { console.error('Insights fetch error:', e); return { data: { insights: null } }; }),
        authAPI.getProfile().catch(e => { console.error('Profile error:', e); return { data: { user: { freezeTokens: null } } }; }),
      ]);

      const nextHabits = habitsRes.data.habits;
      if (nextHabits) {
        setHabits(nextHabits);
        await fetchFailurePatterns(nextHabits);
      }
      
      if (statsRes.data) setStats(statsRes.data);
      if (insightsRes.data.insights) setInsights(insightsRes.data.insights);
      if (profileRes.data.user?.freezeTokens !== null) setFreezeTokens(profileRes.data.user?.freezeTokens || 0);
      
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
    navigate('/');
  };

  useEffect(() => {
    const handleSyncComplete = () => fetchData();
    window.addEventListener('offline-sync-complete', handleSyncComplete);
    return () => window.removeEventListener('offline-sync-complete', handleSyncComplete);
  }, [habits]);

  const handleCompleteClick = (habit) => {
    setMoodHabit(habit);
  };

  const handleCompleteWithMood = async (habitId, moodData) => {
    if (!navigator.onLine) {
      await enqueue({ habitId, completedAt: new Date().toISOString(), ...moodData });
      toast('You are offline — this will sync when you are back.', { icon: '📡' });
      
      // Optimistic UI update
      setHabits(habits.map(h => {
        if (h._id === habitId) {
          return {
            ...h,
            completions: [...(h.completions || []), { date: new Date().toISOString(), completed: true }]
          };
        }
        return h;
      }));
      return;
    }

    try {
      const oldXP = computeGamification(habits).xp;

      const res = await habitAPI.complete(habitId, moodData);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#ec4899', '#38bdf8'],
      });
      toast.success('Habit completed!');

      const coachingRes = await aiAPI.getCoachingMessage({
        habitName: res.data?.habit?.name || habits.find((habit) => habit._id === habitId)?.name || 'your habit',
        status: 'completed',
        streak: res.data?.habit?.currentStreak || 0,
        mode: 'supportive',
      });

      if (coachingRes.data?.message) {
        toast(coachingRes.data.message, { icon: '🤖' });
      }

      await fetchData();

      // Check XP threshold for freeze tokens
      const newHabitsRes = await habitAPI.getAll();
      const newXP = computeGamification(newHabitsRes.data.habits).xp;
      const oldEarned = Math.floor(oldXP / 500);
      const newEarned = Math.floor(newXP / 500);

      if (newEarned > oldEarned) {
        const tokensToAward = newEarned - oldEarned;
        await authAPI.awardFreezeTokens(tokensToAward);
        toast.success(`You earned ${tokensToAward} Freeze Token(s)! ❄️`);
        setFreezeTokens(prev => prev + tokensToAward);
      }

      if (res.data?.chainedHabit) {
        setChainSuggestion(res.data.chainedHabit);
        setTimeout(() => setChainSuggestion(null), 6000);
      }
    } catch (error) {
      if (!error.response && error.isAxiosError) {
        await enqueue({ habitId, completedAt: new Date().toISOString(), ...moodData });
        toast('You are offline — this will sync when you are back.', { icon: '📡' });
        
        // Optimistic UI update
        setHabits(habits.map(h => {
          if (h._id === habitId) {
            return {
              ...h,
              completions: [...(h.completions || []), { date: new Date().toISOString(), completed: true }]
            };
          }
          return h;
        }));
      } else {
        toast.error(error.response?.data?.error || 'Failed to complete habit');
      }
    }
  };

  const handleUseFreezeToken = async () => {
    try {
      const res = await authAPI.useFreezeToken();
      toast.success(`Used a Freeze Token on "${res.data.habitName}"! ❄️`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error using freeze token');
    }
  };

  const handleDeleteClick = (habit) => setDeletingHabit(habit);

  const confirmDelete = async () => {
    if (!deletingHabit) return;

    try {
      await habitAPI.delete(deletingHabit._id);
      toast.success('Habit archived');
      fetchData();
      if (showArchived) fetchArchived();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error deleting habit');
    } finally {
      setDeletingHabit(null);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await habitAPI.export(format);
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habits.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Exported as ${format.toUpperCase()}!`);
    } catch (error) {
      toast.error('Error exporting data');
    }
  };

  const fetchArchived = async () => {
    try {
      const res = await habitAPI.getArchived();
      setArchivedHabits(res.data.habits || []);
    } catch (e) {
      console.error('Archived fetch error:', e);
    }
  };

  useEffect(() => {
    if (showArchived) fetchArchived();
  }, [showArchived]);

  const handleRestore = async (habitId) => {
    try {
      await habitAPI.restore(habitId);
      toast.success('Habit restored');
      fetchData();
      if (showArchived) fetchArchived();
    } catch (error) {
      toast.error('Error restoring habit');
    }
  };

  const handlePermanentDelete = async (habitId) => {
    try {
      await habitAPI.permanentDelete(habitId);
      toast.success('Habit permanently deleted');
      fetchData();
      if (showArchived) fetchArchived();
    } catch (error) {
      toast.error('Error deleting habit');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="mesh-bg"></div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <SkeletonLoader type="stat" />
            <SkeletonLoader type="stat" />
            <SkeletonLoader type="stat" />
            <SkeletonLoader type="stat" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <SkeletonLoader type="habit" />
              <SkeletonLoader type="habit" />
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

      <Navbar
        user={user}
        onLogout={handleLogout}
        onShowBadges={() => setShowBadges(true)}
        onShowShare={() => setShowShare(true)}
        habits={habits}
      />

      {/* Demo banner */}
      {isDemo && !demoBannerDismissed && (
        <div className="w-full bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700/50">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <span>👋</span>
              <span>
                <strong>You're viewing the demo account.</strong>{' '}Data resets daily.
                Want to keep your habits?{' '}
                <a href="/register" className="underline font-semibold hover:opacity-80 transition-opacity">Sign up free</a>
              </span>
            </p>
            <button
              id="demo-banner-dismiss"
              onClick={handleDismissDemoBanner}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors flex-shrink-0 text-lg leading-none"
              aria-label="Dismiss demo banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

      <div className="max-w-7xl mx-auto px-4 pb-8 pt-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

        {/* 3.1 — Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatCard title="Total Habits" value={stats?.totalHabits || 0} icon="🎯" color="purple" />
          <StatCard title="Completed Today" value={stats?.completedToday || 0} icon="✅" color="green" />
          <StatCard title="Avg Streak" value={stats?.avgStreak || 0} icon="🔥" color="orange" />
          <StatCard title="Completion Rate" value={stats?.completionRate || 0} icon="📊" color="blue" />
        </div>

        {/* 3.2 — XP / Level hero card */}
        <XPHeroCard 
          habits={habits} 
          freezeTokens={freezeTokens} 
          onUseFreeze={handleUseFreezeToken} 
        />

        {/* 3.3 + 3.4 — Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

          {/* Left — Habits list */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <div className="flex flex-wrap justify-between items-center mb-5 gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Habits</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowWeeklyReview(true)}
                    className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-sm text-purple-700 dark:text-purple-400 flex items-center gap-1 font-medium"
                  >
                    📅 Weekly Review
                  </button>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"
                  >
                    📋 Templates
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
                  >
                    + Add Habit
                  </button>
                </div>
              </div>

              {habits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4 animate-bounce">🌱</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your journey starts here</h3>
                  <p className="text-gray-400 dark:text-gray-500 max-w-xs mb-6">Add your first habit and start building the life you want, one day at a time.</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-semibold hover:opacity-90 active:scale-95 transition-all"
                  >
                    + Add your first habit
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {habits.map((habit, index) => (
                    <div key={habit._id} className="animate-fade-in-up" style={{ animationDelay: `${0.06 * index}s` }}>
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

              {habits.length > 0 && (
                <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-5">
                  <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Consistency Heatmap</h3>
                  <HabitHeatmap habits={habits} />
                </div>
              )}

              {/* Archived Habits Section */}
              <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-5">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {showArchived ? '▼' : '▶'} Archived Habits
                </button>
                
                {showArchived && (
                  <div className="mt-4 space-y-3">
                    {archivedHabits.length === 0 ? (
                      <p className="text-sm text-gray-500">No archived habits.</p>
                    ) : (
                      archivedHabits.map((habit) => (
                        <div key={habit._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{CATEGORY_EMOJIS[habit.category] || CATEGORY_EMOJIS.default}</span>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{habit.name}</h4>
                              <p className="text-xs text-gray-500">{habit.frequency}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRestore(habit._id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(habit._id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h3 className="text-base font-bold mb-3 text-gray-900 dark:text-white">Weekly Overview</h3>
              <WeeklyChart />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h3 className="text-base font-bold mb-3 text-gray-900 dark:text-white">Category Spread</h3>
              {habits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="text-4xl mb-2">📊</span>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Add habits to see your category breakdown</p>
                </div>
              ) : (
                <RadialChart habits={habits} />
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h3 className="text-base font-bold mb-3 text-gray-900 dark:text-white">Export Data</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  📥 CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  📥 JSON
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h3 className="text-base font-bold mb-3 text-gray-900 dark:text-white">AI Insights</h3>
              {insights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-3xl mb-2">🤖</span>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Complete habits to unlock AI insights</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {insights.map((insight, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex items-start gap-3">
                      <p className="text-xl flex-shrink-0">{insight.icon}</p>
                      <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">{insight.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Failure Patterns</h3>
                  <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                    {failurePatternHabit ? `Analyzing ${failurePatternHabit}` : 'Analyzing habit history'}
                  </p>
                </div>
                <span className="text-lg">🧠</span>
              </div>
              {failurePatternsLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Reading completion history...</p>
              ) : failurePatterns.length > 0 ? (
                <div className="space-y-2">
                  {failurePatterns.map((pattern, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">{pattern}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Complete a few habits over time and this section will highlight where misses tend to cluster.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <VoiceMicButton
        habits={habits}
        onRefresh={fetchData}
        onShowStats={() => setShowBadges(true)}
      />

      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchData(); }} />}
      {editingHabit && <EditHabitModal habit={editingHabit} onClose={() => setEditingHabit(null)} onSuccess={() => { setEditingHabit(null); fetchData(); }} />}
      {deletingHabit && <DeleteConfirmModal itemName={deletingHabit.name} onCancel={() => setDeletingHabit(null)} onConfirm={confirmDelete} />}
      {moodHabit && <MoodCheckInModal habit={moodHabit} onClose={() => setMoodHabit(null)} onSuccess={(moodData) => { const currentHabit = moodHabit; setMoodHabit(null); handleCompleteWithMood(currentHabit._id, moodData || {}); }} />}
      {pomodoroHabit && <PomodoroTimer habitName={pomodoroHabit.name} onClose={() => setPomodoroHabit(null)} />}
      {showTemplates && <TemplatesModal onClose={() => setShowTemplates(false)} onSuccess={() => { setShowTemplates(false); fetchData(); }} />}
      <WeeklyReviewModal isOpen={showWeeklyReview} onClose={() => setShowWeeklyReview(false)} />
      {chainHabit && <HabitChainModal habit={chainHabit} habits={habits} onClose={() => setChainHabit(null)} onSuccess={() => { setChainHabit(null); fetchData(); }} />}
      {showBadges && <BadgesPanel habits={habits} onClose={() => setShowBadges(false)} />}
      {showShare && <ShareCardModal habits={habits} stats={stats} onClose={() => setShowShare(false)} />}
    </div>
  );
}

// Color maps for stat cards
const STAT_COLORS = {
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-brand-purple',
    border: 'border-l-brand-purple',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-brand-green',
    border: 'border-l-brand-green',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-brand-orange',
    border: 'border-l-brand-orange',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-brand-blue',
    border: 'border-l-brand-blue',
  },
};

function StatCard({ title, value, icon, color = 'purple' }) {
  const isCompletionRate = title === 'Completion Rate';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const colors = STAT_COLORS[color];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <div className="mt-1">
            {isCompletionRate ? (
              <div className="flex items-center gap-2 mt-2">
                <CircularProgress percentage={numValue} size={52} strokeWidth={5} />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(numValue)}%</span>
              </div>
            ) : (
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                <AnimatedCounter value={value} />
              </p>
            )}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Category → brand color mapping for habit cards
const CATEGORY_COLORS = {
  health:      { dot: 'bg-brand-green',  icon: 'bg-green-100 dark:bg-green-900/30' },
  fitness:     { dot: 'bg-brand-orange', icon: 'bg-orange-100 dark:bg-orange-900/30' },
  mindfulness: { dot: 'bg-brand-blue',   icon: 'bg-blue-100 dark:bg-blue-900/30' },
  learning:    { dot: 'bg-brand-yellow', icon: 'bg-yellow-100 dark:bg-yellow-900/30' },
  productivity:{ dot: 'bg-brand-purple', icon: 'bg-purple-100 dark:bg-purple-900/30' },
  social:      { dot: 'bg-brand-pink',   icon: 'bg-pink-100 dark:bg-pink-900/30' },
  default:     { dot: 'bg-gray-400',     icon: 'bg-gray-100 dark:bg-gray-800' },
};

const CATEGORY_EMOJIS = {
  health: '❤️', fitness: '💪', mindfulness: '🧘', learning: '📖',
  productivity: '⚡', social: '🤝', default: '✨',
};

function HabitCard({ habit, habits, onComplete, onEdit, onDelete, onTimer, onChain }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const completions = Array.isArray(habit.completions) ? habit.completions : [];
  const isCompletedToday = completions.some((c) => new Date(c.date).toISOString().split('T')[0] === today);
  const cat = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.default;
  const catEmoji = CATEGORY_EMOJIS[habit.category] || CATEGORY_EMOJIS.default;

  return (
    <div className={`rounded-2xl p-4 border-2 transition-all cursor-default group ${
      isCompletedToday
        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
        : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-brand-purple dark:hover:border-brand-purple'
    }`}>
      <div className="flex items-center gap-3">
        {/* Category color dot */}
        <div className={`w-2.5 h-2.5 rounded-full ${cat.dot} flex-shrink-0`} />
        {/* Category icon circle */}
        <div className={`w-11 h-11 rounded-xl ${cat.icon} flex items-center justify-center text-xl flex-shrink-0`}>
          {catEmoji}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{habit.name}</h4>
            {habit.chainedTo && <span className="text-xs px-1.5 py-0.5 rounded-md text-purple-400 bg-purple-500/10 border border-purple-500/20 flex-shrink-0">🔗 Chained</span>}
            {habit.reminder?.enabled && <span className="text-xs px-1.5 py-0.5 rounded-md text-blue-400 bg-blue-500/10 border border-blue-500/20 flex-shrink-0">🔔 {habit.reminder.time}</span>}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            🔥 {habit.currentStreak}d streak · <span className="capitalize">{habit.frequency || 'Daily'}</span>
          </p>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onTimer} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400" title="Pomodoro Timer">⏱</button>
          <button onClick={onChain} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400" title="Chain & Reminder">⚙️</button>
          <button onClick={() => onEdit(habit)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400" title="Edit">✏️</button>
          <button onClick={() => onDelete(habit)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors text-gray-400" title="Delete">🗑️</button>
          {/* Complete button */}
          <button
            onClick={() => {
              if (isCompletedToday || isAnimating) return;
              setIsAnimating(true);
              setTimeout(() => {
                setIsAnimating(false);
                onComplete(habit);
              }, 400);
            }}
            disabled={isCompletedToday}
            className={`ml-1 w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg transition-all ${
              isAnimating
                ? 'scale-125 bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/50 animate-pulse'
                : isCompletedToday
                  ? 'border-green-400 bg-green-100 dark:bg-green-900/30 text-green-500 cursor-not-allowed'
                  : 'border-gray-200 dark:border-gray-700 text-gray-300 hover:border-brand-green hover:text-brand-green hover:scale-110'
            }`}
          >
            ✓
          </button>
        </div>
      </div>
      {habit.description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 ml-[3.25rem] line-clamp-1">{habit.description}</p>
      )}
    </div>
  );
}

// XP Hero card — uses same useGamification hook, displayed on dashboard
function XPHeroCard({ habits, freezeTokens, onUseFreeze }) {
  const { xp, level, levelProgress, nextLevelXP, currentLevelXP } = useGamification(habits);
  const title = level >= 30 ? 'Master' : level >= 20 ? 'Expert' : level >= 10 ? 'Veteran' : level >= 5 ? 'Rising Star' : 'Beginner';
  const xpInLevel = xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  return (
    <div className="bg-gradient-to-r from-violet-600 to-pink-500 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">Level {level} · {title}</p>
          <p className="text-2xl font-bold mt-1">{xp.toLocaleString()} XP</p>
        </div>
        <div className="text-right">
          <div className="text-4xl text-center">🏆</div>
          <div className="mt-2 text-sm flex items-center justify-end gap-2">
            <span className="font-bold">❄️ {freezeTokens || 0}</span>
            <button
              onClick={onUseFreeze}
              disabled={!freezeTokens || freezeTokens <= 0}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded disabled:opacity-50 transition-colors"
            >
              Use Token
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 bg-white/20 rounded-full h-3">
        <div
          className="bg-white rounded-full h-3 transition-all duration-700"
          style={{ width: `${levelProgress}%` }}
        />
      </div>
      <p className="text-xs opacity-70 mt-2">
        {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP to Level {level + 1}
      </p>
    </div>
  );
}

const playChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.value = 1047;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch (_) {}
};

const notifyBrowser = async (title, body) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon-192.png' });
  }
};

function Navbar({ user, onLogout, onShowBadges, onShowShare, habits }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const bellRef = useRef(null);
  
  const avatarLetter = (user?.name || 'U')[0].toUpperCase();

  useEffect(() => {
    const fetchNotifications = async () => {
      setNotifsLoading(true);
      try {
        const res = await notificationAPI.getPending();
        setNotifications(res.data);
      } catch (err) {
        setNotifications([]);
      } finally {
        setNotifsLoading(false);
      }
    };
    fetchNotifications();
  }, [habits]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (notifications.length === 0) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const triggeredKeys = JSON.parse(sessionStorage.getItem('triggered_reminders') || '[]');

      notifications.forEach(habit => {
        if (!habit.reminder?.time) return;

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayName = dayNames[now.getDay()];
        if (!habit.reminder?.days?.includes(todayName)) return;

        // Skip if completed today (checking local date against completions)
        const isCompleted = habit.completions?.some(c => {
          const compDate = new Date(c.date);
          return compDate.toDateString() === now.toDateString();
        });
        if (isCompleted) return;
        
        const [hours, minutes] = habit.reminder.time.split(':').map(Number);
        const reminderTime = new Date(now);
        reminderTime.setHours(hours, minutes, 0, 0);

        if (now.getTime() >= reminderTime.getTime()) {
          const triggerKey = `${habit._id}-${now.toLocaleDateString()}-${habit.reminder.time}`;
          if (!triggeredKeys.includes(triggerKey)) {
            playChime();
            notifyBrowser('FocusForge Reminder', `Time for your habit: ${habit.name}`);
            triggeredKeys.push(triggerKey);
            sessionStorage.setItem('triggered_reminders', JSON.stringify(triggeredKeys));
          }
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* Left — Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            FocusForge
          </span>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-1">
          {/* Badges */}
          <button
            onClick={onShowBadges}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-brand-purple dark:hover:text-brand-purple hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            title="Achievements"
          >
            🏆
          </button>

          {/* Share */}
          <button
            onClick={onShowShare}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-brand-blue dark:hover:text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Share progress"
          >
            📤
          </button>

          {/* Bell Notifications */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen(prev => !prev)}
              className="relative p-2 rounded-full hover:bg-white/10 transition text-gray-500 dark:text-gray-400"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-900 dark:text-white">
                  Pending Reminders
                </div>
                {notifsLoading ? (
                  <div className="p-4 text-sm text-gray-500">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No reminders due right now.</div>
                ) : (
                  <ul className="max-h-60 overflow-y-auto">
                    {notifications.map(habit => (
                      <li key={habit._id} className="px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div className="font-medium text-gray-900 dark:text-white">{habit.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Reminder: {habit.reminder?.time}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Avatar dropdown */}
          <div className="relative ml-1" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink text-white font-bold text-sm flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-sm"
              title={user?.name || 'Account'}
            >
              {avatarLetter}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden z-50 animate-fade-in-up">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'User'}</p>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                >
                  <span>→</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Dashboard;
