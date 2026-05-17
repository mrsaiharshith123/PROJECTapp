import { useState } from "react";

/** Accordion section for profile settings and similar. */
export default function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{title}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <span
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-slate-800">{children}</div>
      )}
    </div>
  );
}
