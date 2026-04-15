import { useRef } from 'react';
import { useGamification } from '../hooks/useGamification';

export default function ShareCardModal({ habits, stats, onClose }) {
  const canvasRef = useRef(null);
  const { xp, level, badges } = useGamification(habits);
  const unlockedBadges = badges.filter(b => b.unlocked);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = 400, H = 700;
    canvas.width = W;
    canvas.height = H;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f0524');
    grad.addColorStop(0.5, '#1a0533');
    grad.addColorStop(1, '#050b14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Glow orbs
    const addGlow = (x, y, r, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    };
    addGlow(50, 100, 200, 'rgba(139,92,246,0.2)');
    addGlow(350, 600, 200, 'rgba(236,72,153,0.15)');

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8b5cf6';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('FOCUSFORGE', W / 2, 40);

    // Logo emoji
    ctx.font = '48px serif';
    ctx.fillText('⚡', W / 2, 110);

    // Username
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.fillText(user.name || 'Habit Champion', W / 2, 155);

    // Level
    ctx.fillStyle = '#a78bfa';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(`Level ${level} · ${xp.toLocaleString()} XP`, W / 2, 178);

    // Divider
    ctx.strokeStyle = 'rgba(139,92,246,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 195);
    ctx.lineTo(W - 40, 195);
    ctx.stroke();

    // Stats grid
    const statItems = [
      { label: 'Total Habits', value: stats?.totalHabits ?? habits.length },
      { label: 'Done Today', value: stats?.completedToday ?? 0 },
      { label: 'Avg Streak', value: stats?.avgStreak ?? 0 },
      { label: 'Completion %', value: `${stats?.completionRate ?? 0}%` },
    ];
    statItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? W / 4 : (3 * W) / 4;
      const y = 240 + row * 90;
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.fillText(String(item.value), x, y);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(item.label, x, y + 20);
    });

    // Badges row
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`${unlockedBadges.length} badges unlocked`, W / 2, 430);
    const badgeStart = W / 2 - (Math.min(unlockedBadges.length, 6) * 22) / 2;
    ctx.font = '22px serif';
    unlockedBadges.slice(0, 6).forEach((b, i) => {
      ctx.fillText(b.icon, badgeStart + i * 26, 460);
    });

    // Footer
    ctx.fillStyle = 'rgba(139,92,246,0.4)';
    ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = '#a78bfa';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Track habits · Build streaks · Level up', W / 2, H - 28);
    ctx.fillStyle = '#6d28d9';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('focusforge.app', W / 2, H - 10);

    // Download
    const link = document.createElement('a');
    link.download = `focusforge-${user.name || 'progress'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel p-6 w-full max-w-sm animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Share Progress</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Download your achievement card</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors" style={{ color: 'var(--text-secondary)' }}>✕</button>
        </div>

        {/* Preview — always dark regardless of theme */}
        <div
          className="rounded-xl overflow-hidden mb-6 shadow-2xl shadow-purple-500/20"
          style={{
            background: 'linear-gradient(135deg, #0f0524, #1a0533, #050b14)',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40 }}>⚡</div>
          <p style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1.125rem', margin: '8px 0 2px' }}>
            {user.name || 'Habit Champion'}
          </p>
          <p style={{ color: '#c4b5fd', fontSize: '0.75rem', marginBottom: '16px' }}>
            Level {level} · {xp.toLocaleString()} XP
          </p>
          <div className="grid grid-cols-2 gap-3 text-center mb-4">
            {[
              { l: 'Habits', v: stats?.totalHabits ?? habits.length },
              { l: 'Streak', v: `${stats?.avgStreak ?? 0}d` },
              { l: 'Today', v: stats?.completedToday ?? 0 },
              { l: 'Rate', v: `${stats?.completionRate ?? 0}%` },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '10px',
                  padding: '8px 4px',
                }}
              >
                <p style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1.25rem' }}>{s.v}</p>
                <p style={{ color: '#c4b5fd', fontSize: '0.7rem' }}>{s.l}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '1.2rem', letterSpacing: '0.2em' }}>
            {unlockedBadges.slice(0, 6).map(b => b.icon).join(' ')}
          </p>
          {unlockedBadges.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Complete habits to unlock badges!</p>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <button onClick={downloadCard} className="w-full glass-button py-3 rounded-xl font-semibold">
          ⬇ Download PNG Card
        </button>
      </div>
    </div>
  );
}
