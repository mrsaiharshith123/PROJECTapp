/** Shared profile form field styling. */
export const profileInputClass =
  "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";

export function ProfileField({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
