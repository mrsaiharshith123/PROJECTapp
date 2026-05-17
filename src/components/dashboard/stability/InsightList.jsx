/** Renders stability insight cards (tone-colored). */
export default function InsightList({ insights, limit = 6 }) {
  if (!insights?.length) return null;
  const rows = insights.slice(0, limit);
  return (
    <ul className="space-y-2">
      {rows.map((ins) => (
        <li
          key={ins.id}
          className={`text-sm rounded-lg px-3 py-2 border ${
            ins.tone === "critical"
              ? "bg-red-50 border-red-100 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200"
              : ins.tone === "warning"
                ? "bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200"
                : ins.tone === "positive"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-900 dark:text-emerald-200"
                  : "bg-gray-50 border-gray-100 text-gray-800 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200"
          }`}
        >
          {ins.text}
        </li>
      ))}
    </ul>
  );
}
