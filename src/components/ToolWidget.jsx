/** Clickable tool tile for the Tools grid. */
export default function ToolWidget({ icon, title, subtitle, accent, onClick, disabled = false }) {
  const accentClass =
    accent === "teal"
      ? "from-teal-500/10 to-emerald-600/5 border-teal-200/80 dark:border-teal-800 hover:border-teal-400"
      : accent === "violet"
        ? "from-violet-500/10 to-indigo-600/5 border-violet-200/80 dark:border-violet-800 hover:border-violet-400"
        : accent === "amber"
          ? "from-amber-500/10 to-orange-600/5 border-amber-200/80 dark:border-amber-800 hover:border-amber-400"
          : accent === "rose"
            ? "from-rose-500/10 to-pink-600/5 border-rose-200/80 dark:border-rose-800 hover:border-rose-400"
            : accent === "yellow"
              ? "from-yellow-500/10 to-amber-600/5 border-yellow-200/80 dark:border-yellow-800 hover:border-yellow-400"
              : "from-indigo-500/10 to-violet-600/5 border-indigo-200/80 dark:border-indigo-800 hover:border-indigo-400";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center justify-center text-center min-h-[9.5rem] p-4 rounded-2xl border bg-gradient-to-br ${accentClass} bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 ${
        disabled
          ? "opacity-75 cursor-default"
          : "hover:shadow-lg hover:-translate-y-1 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      }`}
    >
      <span
        className="text-4xl mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
        aria-hidden
      >
        {icon}
      </span>
      <span className="text-sm font-bold text-gray-900 dark:text-slate-50 leading-tight">{title}</span>
      {subtitle && (
        <span className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 line-clamp-2 leading-snug">
          {subtitle}
        </span>
      )}
    </button>
  );
}
