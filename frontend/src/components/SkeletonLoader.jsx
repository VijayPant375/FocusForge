export default function SkeletonLoader({ type }) {
  const block = 'bg-slate-300/60 dark:bg-slate-600/40 rounded';

  if (type === 'stat') {
    return (
      <div className="glass-card p-6 animate-shimmer overflow-hidden relative">
        <div className={`h-4 w-24 mb-4 ${block}`}></div>
        <div className={`h-8 w-16 ${block}`}></div>
        <div className={`absolute top-6 right-6 w-10 h-10 rounded-full ${block}`}></div>
      </div>
    );
  }

  if (type === 'habit') {
    return (
      <div className="glass-card p-4 flex items-center justify-between mb-4 animate-shimmer overflow-hidden">
        <div className="flex-1">
          <div className={`h-5 w-48 mb-2 ${block}`}></div>
          <div className={`h-4 w-3/4 mb-3 ${block}`}></div>
          <div className="flex gap-4">
            <div className={`h-4 w-20 ${block}`}></div>
            <div className={`h-4 w-20 ${block}`}></div>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <div className={`h-10 w-10 ${block}`}></div>
          <div className={`h-10 w-10 ${block}`}></div>
          <div className={`h-10 w-24 ${block}`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 min-h-[300px] flex items-center justify-center animate-shimmer">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-[3px] border-transparent animate-spin"
          style={{
            borderTopColor: 'var(--accent-1)',
            borderRightColor: 'var(--ring-track)',
            borderBottomColor: 'var(--ring-track)',
            borderLeftColor: 'var(--ring-track)',
          }}
        />
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      </div>
    </div>
  );
}
