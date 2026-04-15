function DeleteConfirmModal({ itemName, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-panel p-8 w-full max-w-sm animate-fade-in-up text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="mb-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Delete Habit?</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <span className="font-semibold text-red-400">"{itemName}"</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-center gap-3 relative z-10 w-full mt-8">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg transition-colors border border-[var(--glass-border)] hover:bg-white/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-lg shadow-red-500/30"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
