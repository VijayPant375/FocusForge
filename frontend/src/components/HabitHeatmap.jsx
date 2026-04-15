import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function HeatmapTooltip({ tooltip }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!tooltip) return;
    const TOOLTIP_W = 180;
    const TOOLTIP_H = 90;
    let x = tooltip.x + tooltip.cellW / 2;
    let y = tooltip.y - 12;

    // Clamp x so tooltip doesn't go off screen edges
    if (x - TOOLTIP_W / 2 < 8) x = TOOLTIP_W / 2 + 8;
    if (x + TOOLTIP_W / 2 > window.innerWidth - 8) x = window.innerWidth - TOOLTIP_W / 2 - 8;

    // If not enough space above, flip below
    if (y - TOOLTIP_H < 8) y = tooltip.y + tooltip.cellH + 12;

    setPos({ x, y: y - TOOLTIP_H < 8 ? y : y });
  }, [tooltip]);

  if (!tooltip) return null;

  const { day } = tooltip;
  const flipped = tooltip.y - 90 < 8;

  return createPortal(
    <div
      className="pointer-events-none"
      style={{
        position: 'fixed',
        left: pos.x,
        top: flipped ? tooltip.y + tooltip.cellH + 8 : pos.y,
        transform: flipped ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
        zIndex: 99999,
        minWidth: '160px',
        maxWidth: '220px',
        // Solid opaque background for maximum readability
        background: 'var(--tooltip-bg)',
        border: '1px solid var(--tooltip-border)',
        borderRadius: '10px',
        padding: '10px 12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Arrow */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          ...(flipped
            ? { top: -6, borderBottom: '6px solid var(--tooltip-border)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent' }
            : { bottom: -6, borderTop: '6px solid var(--tooltip-border)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent' }),
          width: 0,
          height: 0,
        }}
      />

      <p className="font-bold text-xs mb-1.5" style={{ color: '#f1f5f9', letterSpacing: '0.02em' }}>
        📅 {day.date}
      </p>
      <p className="text-xs font-semibold mb-1" style={{ color: day.count > 0 ? '#a78bfa' : '#94a3b8' }}>
        {day.count === 0
          ? '— No habits completed'
          : `✅ ${day.count} habit${day.count > 1 ? 's' : ''} completed`}
      </p>
      {day.count > 0 && (
        <ul className="mt-1.5 space-y-1">
          {day.habitNames.map((name, idx) => (
            <li key={idx} className="flex items-center gap-1.5 text-xs">
              <span
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#a78bfa' }}
              />
              <span style={{ color: '#cbd5e1' }}>{name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body
  );
}

export default function HabitHeatmap({ habits }) {
  const days = 90;
  const [tooltip, setTooltip] = useState(null);

  const heatmapData = useMemo(() => {
    const data = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data[date.toISOString().split('T')[0]] = { count: 0, habitNames: [] };
    }

    if (habits) {
      habits.forEach(habit => {
        (habit.completions || []).forEach(c => {
          const cDate = new Date(c.date).toISOString().split('T')[0];
          if (data[cDate]) {
            data[cDate].count += 1;
            data[cDate].habitNames.push(habit.name);
          }
        });
      });
    }

    return Object.entries(data).map(([date, info]) => ({ date, ...info }));
  }, [habits]);

  const getColor = (count) => {
    if (count === 0) return 'var(--heatmap-empty)';
    if (count === 1) return 'rgba(139, 92, 246, 0.35)';
    if (count === 2) return 'rgba(139, 92, 246, 0.65)';
    return 'rgba(139, 92, 246, 1)';
  };

  const getBorder = (count) => {
    if (count === 0) return '1px solid var(--heatmap-border)';
    return '1px solid rgba(139, 92, 246, 0.3)';
  };

  const handleMouseEnter = (e, day) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      day,
      x: rect.left + rect.width / 2,
      y: rect.top,
      cellW: rect.width,
      cellH: rect.height,
    });
  };

  return (
    <div className="w-full relative">
      <HeatmapTooltip tooltip={tooltip} />

      <div className="overflow-x-auto pb-3">
        <div className="flex gap-[3px]" style={{ minWidth: 'max-content' }}>
          {heatmapData.map((day, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-[2px] transition-all duration-150 cursor-pointer flex-shrink-0 hover:ring-2 hover:ring-purple-400 hover:ring-offset-1 hover:scale-125"
              style={{
                backgroundColor: getColor(day.count),
                border: getBorder(day.count),
              }}
              onMouseEnter={(e) => handleMouseEnter(e, day)}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs mt-2">
        <span style={{ color: 'var(--text-secondary)' }}>90 days ago</span>
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--text-secondary)' }}>Less</span>
          {[0, 1, 2, 3].map(n => (
            <div
              key={n}
              className="w-3 h-3 rounded-[2px] flex-shrink-0"
              style={{ backgroundColor: getColor(n), border: getBorder(n) }}
            />
          ))}
          <span style={{ color: 'var(--text-secondary)' }}>More</span>
        </div>
        <span style={{ color: 'var(--text-secondary)' }}>Today</span>
      </div>
    </div>
  );
}
