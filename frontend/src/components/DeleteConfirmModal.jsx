function DeleteConfirmModal({ onConfirm, onCancel, itemName }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] opacity-100 transition-opacity">
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 w-full max-w-sm shadow-2xl transform transition-all scale-100">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/10 mb-4">
            <span className="text-3xl">🗑️</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Delete Habit?</h3>
          <p className="text-gray-400 text-sm mb-6">
            Are you sure you want to delete <span className="text-gray-200 font-semibold">"{itemName}"</span>? This action cannot be undone, and you will lose all completions and streaks attached to it.
          </p>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-200 font-medium rounded-xl transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
