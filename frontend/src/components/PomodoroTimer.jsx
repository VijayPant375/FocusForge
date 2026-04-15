import { useState, useEffect, useRef, useCallback } from 'react';

const PRESETS = [
  { label: '25 min', work: 25 * 60, break: 5 * 60 },
  { label: '50 min', work: 50 * 60, break: 10 * 60 },
  { label: '15 min', work: 15 * 60, break: 3 * 60 },
];

const SOUNDS = {
  bell: [880, 0.3, 'sine'],
  chime: [1047, 0.2, 'triangle'],
  none: null,
};

function playSound(type) {
  if (type === 'none' || !SOUNDS[type]) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const [freq, vol, wave] = SOUNDS[type];
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch (_) {}
}

export default function PomodoroTimer({ habitName, onClose }) {
  const [preset, setPreset] = useState(0);
  const [isWork, setIsWork] = useState(true);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].work);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState('bell');
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pomodoro_sessions') || '[]'); } catch { return []; }
  });
  const intervalRef = useRef(null);
  const total = isWork ? PRESETS[preset].work : PRESETS[preset].break;
  const progress = ((total - timeLeft) / total) * 100;
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const strokeDash = circ - (progress / 100) * circ;

  const switchPhase = useCallback(() => {
    playSound(sound);
    setIsWork(prev => {
      const next = !prev;
      setTimeLeft(next ? PRESETS[preset].work : PRESETS[preset].break);
      return next;
    });
  }, [sound, preset]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { switchPhase(); return 0; }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, switchPhase]);

  const handlePreset = (i) => {
    setPreset(i);
    setIsWork(true);
    setTimeLeft(PRESETS[i].work);
    setRunning(false);
  };

  const handleReset = () => {
    setRunning(false);
    setIsWork(true);
    setTimeLeft(PRESETS[preset].work);
  };

  const logSession = () => {
    const session = { habit: habitName, date: new Date().toISOString(), preset: PRESETS[preset].label };
    const updated = [session, ...sessions].slice(0, 20);
    setSessions(updated);
    localStorage.setItem('pomodoro_sessions', JSON.stringify(updated));
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-8 w-full max-w-sm animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Focus Timer</h2>
            {habitName && <p className="text-sm mt-0.5" style={{ color: 'var(--accent-1)' }}>🎯 {habitName}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" style={{ color: 'var(--text-secondary)' }}>✕</button>
        </div>

        {/* Preset selector */}
        <div className="flex gap-2 mb-6">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => handlePreset(i)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${preset === i ? 'glass-button' : 'border border-[var(--glass-border)] hover:bg-white/10'}`}
              style={preset !== i ? { color: 'var(--text-secondary)' } : {}}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Phase badge */}
        <div className="flex justify-center mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isWork ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
            {isWork ? '🎯 Focus Time' : '☕ Break Time'}
          </span>
        </div>

        {/* Circular Timer SVG */}
        <div className="flex justify-center mb-6">
          <div className="relative" style={{ width: 180, height: 180 }}>
            <svg width="180" height="180" className="-rotate-90">
              <circle cx="90" cy="90" r={radius} stroke="var(--ring-track)" strokeWidth="10" fill="none" />
              <circle
                cx="90" cy="90" r={radius}
                stroke={isWork ? '#8b5cf6' : '#10b981'}
                strokeWidth="10" fill="none"
                strokeDasharray={circ}
                strokeDashoffset={strokeDash}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmt(timeLeft)}</span>
              <span className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{isWork ? 'remaining' : 'break'}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button onClick={handleReset} className="px-4 py-2 rounded-lg border border-[var(--glass-border)] hover:bg-white/10 transition-colors text-sm" style={{ color: 'var(--text-secondary)' }}>
            ↺ Reset
          </button>
          <button
            onClick={() => { setRunning(r => !r); }}
            className={`px-8 py-2 rounded-lg font-semibold transition-all ${running ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'glass-button'}`}
          >
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button onClick={logSession} className="px-4 py-2 rounded-lg border border-[var(--glass-border)] hover:bg-white/10 transition-colors text-sm" style={{ color: 'var(--text-secondary)' }}>
            ✓ Log
          </button>
        </div>

        {/* Sound selector */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>🔔 Sound:</span>
          {Object.keys(SOUNDS).map(s => (
            <button
              key={s}
              onClick={() => setSound(s)}
              className={`capitalize text-xs px-2.5 py-1 rounded-lg border transition-colors ${sound === s ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-[var(--glass-border)] hover:bg-white/10'}`}
              style={sound !== s ? { color: 'var(--text-secondary)' } : {}}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Session history */}
        {sessions.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Recent Sessions</p>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {sessions.slice(0, 5).map((s, i) => (
                <div key={i} className="flex justify-between items-center text-xs glass-card px-3 py-1.5">
                  <span style={{ color: 'var(--text-primary)' }}>{s.habit || 'Free session'}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.preset} · {new Date(s.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
