export default function StreakFlame({ streak = 0 }) {
  // Color and visual profile based on streak length
  let mainColor = '#94a3b8';     // neutral gray — no streak
  let secondaryColor = '#64748b';
  let glowColor = 'transparent';
  let isAnimated = false;

  if (streak >= 30) {
    mainColor = '#ef4444';
    secondaryColor = '#f97316';
    glowColor = 'rgba(239, 68, 68, 0.6)';
    isAnimated = true;
  } else if (streak >= 7) {
    mainColor = '#f97316';
    secondaryColor = '#fbbf24';
    glowColor = 'rgba(249, 115, 22, 0.4)';
    isAnimated = true;
  } else if (streak >= 3) {
    mainColor = '#f59e0b';
    secondaryColor = '#fbbf24';
    glowColor = 'rgba(245, 158, 11, 0.3)';
  } else if (streak >= 1) {
    mainColor = '#60a5fa';
    secondaryColor = '#93c5fd';
    glowColor = 'transparent';
  }

  return (
    <span
      className="inline-flex items-center justify-center flex-shrink-0"
      style={{ width: '18px', height: '18px', position: 'relative' }}
    >
      {/* Glow ring for hot streaks */}
      {isAnimated && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            backgroundColor: glowColor,
            transform: 'scale(1.5)',
            opacity: 0.4,
          }}
        />
      )}
      <svg
        width="14"
        height="18"
        viewBox="0 0 14 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1, filter: streak >= 7 ? `drop-shadow(0 0 3px ${glowColor})` : 'none' }}
      >
        {/* Outer flame body */}
        <path
          d="M7 0 C7 0 2 5 2 10 C2 13.5 4.5 17 7 17 C9.5 17 12 13.5 12 10 C12 5 7 0 7 0Z"
          fill={mainColor}
          fillOpacity={streak === 0 ? 0.35 : 0.9}
        />
        {/* Inner flame core */}
        {streak >= 1 && (
          <path
            d="M7 6 C7 6 4.5 9 4.5 11.5 C4.5 13.5 5.8 15.5 7 15.5 C8.2 15.5 9.5 13.5 9.5 11.5 C9.5 9 7 6 7 6Z"
            fill={secondaryColor}
            fillOpacity={0.95}
          />
        )}
      </svg>
    </span>
  );
}
