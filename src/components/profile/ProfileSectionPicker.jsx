const SECTIONS = [
  { id: "personal", label: "Personal", hint: "Name & theme" },
  { id: "money", label: "Money setup", hint: "Income & mode" },
  { id: "notifications", label: "Notifications", hint: "Alerts" },
  { id: "security", label: "Security & data", hint: "Backup" },
  { id: "import", label: "Import & export", hint: "JSON" },
  { id: "history", label: "History", hint: "Fix payments" },
];

export function ProfileSectionPicker({ openId, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SECTIONS.map((s) => {
        const active = openId === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(active ? null : s.id)}
            className={`text-left rounded-2xl border px-3 py-3 transition-all ${
              active
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 shadow-sm ring-1 ring-indigo-500/30"
                : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-800"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                active ? "text-indigo-800 dark:text-indigo-100" : "text-gray-800 dark:text-slate-100"
              }`}
            >
              {s.label}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{s.hint}</p>
          </button>
        );
      })}
    </div>
  );
}
