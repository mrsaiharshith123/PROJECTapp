import { useId, useState } from "react";

/** Small (i) control — tap to show a short plain-language explanation. */
export default function InfoTip({ text, label = "How this is calculated" }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  if (!text) return null;

  return (
    <span className="inline-flex items-center align-middle ml-1 relative">
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-500 text-[10px] font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 leading-none"
        title={label}
      >
        i
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <span
            id={id}
            role="tooltip"
            className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1.5 w-56 max-w-[min(16rem,90vw)] rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-lg px-3 py-2 text-[11px] leading-snug text-gray-700 dark:text-slate-200"
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
}
