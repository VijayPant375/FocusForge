import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FEATURES = [
  {
    emoji: '🤖',
    title: 'AI-Powered Coaching',
    desc: 'Gemini 1.5 Flash analyzes your habits and delivers personalized insights, failure pattern detection, and motivational coaching messages.',
    color: 'from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800/50',
    badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  },
  {
    emoji: '🏆',
    title: 'Streaks & XP',
    desc: 'Gamified progression with XP earned per completion, level titles, streak flames, and 20+ unlockable achievement badges.',
    color: 'from-pink-500/10 to-rose-500/10 border-pink-200 dark:border-pink-800/50',
    badge: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
  },
  {
    emoji: '📊',
    title: 'Analytics That Matter',
    desc: 'Consistency heatmaps, weekly progress charts, failure pattern detection, category breakdowns, and completion rate tracking.',
    color: 'from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800/50',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  },
];

const TECH_BADGES = [
  { label: 'React 18', color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' },
  { label: 'Node.js', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
  { label: 'MongoDB', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  { label: 'Express', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
  { label: 'Gemini AI', color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  { label: 'Docker', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  { label: 'Render', color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' },
];

export default function Landing() {
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      const res = await axios.post(`${API_URL}/users/login`, {
        email: 'demo@focusforge.app',
        password: 'demo1234',
      });
      localStorage.setItem('token', res.data.token);
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      toast.success('Welcome to FocusForge demo!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Demo unavailable right now. Try signing up instead.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">FocusForge</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              id="landing-signup-nav"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* ── Architecture callout strip ── */}
      <div className="w-full bg-gradient-to-r from-violet-600 to-pink-500 py-2.5 px-4 text-center text-white text-sm font-medium tracking-wide">
        <span className="opacity-90">⚡</span>{' '}
        5 independent microservices + API gateway — deployed on Render
        <span className="ml-3 opacity-75 text-xs">| Gemini 1.5 Flash AI · MongoDB Atlas · Docker</span>
      </div>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">

        {/* Floating glow blobs */}
        <div className="pointer-events-none absolute inset-x-0 top-20 overflow-hidden" aria-hidden="true">
          <div className="mx-auto w-[600px] h-[300px] bg-gradient-to-r from-violet-400/20 via-pink-400/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-violet-200 dark:border-violet-700/50">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live on Render · Gemini AI active
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-5">
            Build habits that{' '}
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
              stick
            </span>
            <br />
            <span className="text-4xl sm:text-5xl font-bold text-gray-600 dark:text-gray-400">
              powered by real AI coaching
            </span>
          </h1>

          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            FocusForge combines gamified streak tracking, personalized Gemini AI coaching, and detailed
            analytics into a production-deployed full-stack microservices platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <button
              id="landing-try-demo"
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold text-base hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-violet-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {demoLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Loading demo...
                </>
              ) : (
                <>🚀 Try Demo</>
              )}
            </button>
            <Link
              to="/register"
              id="landing-signup-hero"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-base hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              ✨ Sign Up Free
            </Link>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">No account needed for demo</p>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Everything you need to build lasting habits
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10 text-sm">
          All features are live and working in the demo account below.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`rounded-2xl p-6 border bg-gradient-to-br ${f.color} transition-all hover:shadow-lg hover:-translate-y-1 duration-200`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl mb-4 ${f.badge}`}>
                {f.emoji}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo credentials callout ── */}
      <section className="max-w-2xl mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-dashed border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-2">Demo Account</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
            <span className="font-mono bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-xs">demo@focusforge.app</span>
            {' '}·{' '}
            <span className="font-mono bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-xs">demo1234</span>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Pre-seeded with 30 days of habit history · Data resets daily</p>
        </div>
      </section>

      {/* ── Tech stack badges ── */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Built with</p>
        <div className="flex flex-wrap justify-center gap-2">
          {TECH_BADGES.map((b) => (
            <span key={b.label} className={`px-4 py-1.5 rounded-full text-sm font-semibold border border-transparent ${b.color}`}>
              {b.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>
            Built by{' '}
            <a
              href="https://github.com/VijayPant375"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 dark:text-white font-semibold hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              VijayPant375
            </a>
          </span>
          <a
            href="https://focusforge-frontend-piek.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            id="landing-live-url"
            className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
          >
            focusforge-frontend-piek.onrender.com
          </a>
          <a
            href="https://github.com/VijayPant375"
            target="_blank"
            rel="noopener noreferrer"
            id="landing-github-link"
            className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
