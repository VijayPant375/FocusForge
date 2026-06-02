export default function SkeletonLoader({ type }) {
  const block = 'bg-gray-200 dark:bg-gray-800 rounded-xl';

  if (type === 'stat') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className={`h-4 w-24 mb-3 ${block}`}></div>
            <div className={`h-8 w-16 ${block}`}></div>
          </div>
          <div className={`w-12 h-12 rounded-2xl ${block}`}></div>
        </div>
      </div>
    );
  }

  if (type === 'habit') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between mb-4 animate-pulse">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
          <div className={`w-11 h-11 rounded-xl flex-shrink-0 ${block}`}></div>
          <div className="flex-1">
            <div className={`h-5 w-48 mb-2 ${block}`}></div>
            <div className={`h-4 w-32 ${block}`}></div>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <div className={`h-10 w-10 ${block}`}></div>
          <div className={`h-10 w-10 ${block}`}></div>
          <div className={`h-10 w-10 ${block}`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 min-h-[300px] flex items-center justify-center border border-gray-100 dark:border-gray-800 animate-pulse">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-[3px] border-gray-100 dark:border-gray-800 border-t-brand-purple animate-spin" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading your data...</p>
      </div>
    </div>
  );
}
