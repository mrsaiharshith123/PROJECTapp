import { useTranslation } from "../../../i18n/I18nProvider.js";

/**
 * Pick an existing bill/loan or run the tool without adding one.
 */
export default function ToolSourcePicker({
  title,
  hint,
  items = [],
  emptyMessage,
  manualLabel,
  addLabel,
  onPick,
  onManual,
  onAdd,
  accent = "indigo",
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("tools.picker.chooseOne");
  const resolvedEmpty = emptyMessage ?? t("tools.picker.nothingSaved");
  const resolvedManual = manualLabel ?? t("tools.picker.checkWithoutBill");

  const borderPick = {
    indigo: "hover:border-indigo-500 dark:hover:border-indigo-400",
    teal: "hover:border-teal-500 dark:hover:border-teal-400",
    yellow: "hover:border-yellow-500 dark:hover:border-yellow-400",
    violet: "hover:border-violet-500 dark:hover:border-violet-400",
  }[accent] || "hover:border-indigo-500";

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-800 dark:text-slate-100 leading-relaxed">{resolvedTitle}</p>
      {hint && <p className="text-xs text-gray-500 dark:text-slate-400">{hint}</p>}

      {items.length > 0 ? (
        <ul className="space-y-2 max-h-52 overflow-y-auto pr-1 -mr-1 scroll-smooth">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onPick(item)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 transition ${borderPick}`}
              >
                <p className="font-semibold text-gray-900 dark:text-slate-50 truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">{item.subtitle}</p>
                )}
                {item.meta && (
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{item.meta}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-slate-400 rounded-xl bg-gray-50 dark:bg-slate-800/80 px-3 py-3">
          {resolvedEmpty}
        </p>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={onManual}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-500 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          {resolvedManual}
        </button>
        {addLabel && onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
          >
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}
