export function Modal({ title, children, onClose, footer }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 max-h-[90vh] overflow-hidden flex flex-col">
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
            <h2 id="modal-title" className="text-lg font-bold text-gray-900 dark:text-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2 py-1 rounded-lg hover:bg-gray-50"
            >
              ×
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-700 shrink-0 bg-gray-50/80 dark:bg-slate-800/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
