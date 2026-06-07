import { useState, useEffect } from 'react';
import { analyticsAPI, aiAPI } from '../api';

export default function WeeklyReviewModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      analyticsAPI.getWeeklyReview()
        .then(res => {
          setData(res.data);
          setLoading(false);
          
          setAiLoading(true);
          aiAPI.getWeeklyReview(res.data)
            .then(response => {
              setAiInsights(response.data.insights);
              setAiLoading(false);
            })
            .catch(() => {
              setAiLoading(false);
            });
        })
        .catch(err => {
          console.error('Failed to fetch weekly review', err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-3xl">
          <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-purple-500/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-pink-500/20 rounded-full blur-[80px]"></div>
        </div>
        
        <div className="relative z-10 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto flex items-center justify-center mb-4 shadow-lg">
            <span className="text-2xl text-white">📅</span>
          </div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Weekly Review</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Here is how you did over the past 7 days</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-4 relative z-10 mb-6">
            <div className="bg-black/20 rounded-2xl p-4 border border-[var(--glass-border)] flex flex-col items-center">
              <span className="text-3xl font-bold text-white mb-1">{data.totalCompletionsThisWeek}</span>
              <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Completions</span>
            </div>
            <div className="bg-black/20 rounded-2xl p-4 border border-[var(--glass-border)] flex flex-col items-center">
              <span className="text-3xl font-bold text-white mb-1">{data.completionRate}%</span>
              <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Consistency</span>
            </div>
            <div className="bg-black/20 rounded-2xl p-4 border border-[var(--glass-border)] flex flex-col items-center">
              <span className="text-3xl font-bold text-white mb-1">{data.bestStreak}</span>
              <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Best Streak</span>
            </div>
            <div className="bg-black/20 rounded-2xl p-4 border border-[var(--glass-border)] flex flex-col items-center text-center">
              <span className="text-lg font-bold text-white mb-1 truncate w-full px-2" title={data.mostConsistentHabit || 'None'}>
                {data.mostConsistentHabit || 'None'}
              </span>
              <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Top Habit</span>
            </div>
          </div>
        ) : (
          <div className="text-center text-red-400 py-4">Failed to load data.</div>
        )}

        {aiLoading && (
          <div className="relative z-10 mb-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">Generating AI insights…</p>
          </div>
        )}
        
        {!aiLoading && aiInsights.length > 0 && (
          <div className="relative z-10 mb-6 bg-black/20 rounded-2xl p-4 border border-[var(--glass-border)]">
            {aiInsights.map((insight, idx) => (
              <p key={idx} className="text-sm text-[var(--text-secondary)] mb-2 last:mb-0">
                {insight}
              </p>
            ))}
          </div>
        )}

        <div className="relative z-10 mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
