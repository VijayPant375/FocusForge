export default function CircularProgress({ 
  percentage = 0, 
  size = 120, 
  strokeWidth = 12, 
  color = "var(--accent-1)",
  label = ""
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track — uses dedicated var visible in both modes */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--ring-track)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ strokeDashoffset }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-bold" style={{ color: 'var(--text-primary)', fontSize: size < 80 ? '0.85rem' : '1.25rem' }}>
          {percentage}%
        </span>
        {label && (
          <span className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        )}
      </div>
    </div>
  );
}
