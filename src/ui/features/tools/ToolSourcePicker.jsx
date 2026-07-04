import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { Button } from "../../primitives/Button.jsx";

const ACCENT_TILE = {
  indigo: "indigo",
  teal: "teal",
  yellow: "amber",
  violet: "indigo",
};

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
  selectedId = null,
}) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("tools.picker.chooseOne");
  const resolvedEmpty = emptyMessage ?? t("tools.picker.nothingSaved");
  const resolvedManual = manualLabel ?? t("tools.picker.checkWithoutBill");
  const tileTone = ACCENT_TILE[accent] || "indigo";

  return (
    <div className="ed-stack">
      <p className="text-sm leading-relaxed">{resolvedTitle}</p>
      {hint ? <p className="text-xs opacity-75">{hint}</p> : null}

      {items.length > 0 ? (
        <ul className="ed-stack-sm max-h-52 overflow-y-auto">
          {items.map((item) => {
            const selected = selectedId != null && String(selectedId) === String(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onPick(item)}
                  className={`ed-inset w-full text-left !p-3 transition ${ selected ? "ring-2 ring-[var(--ed-gold)]" : "" }`}
                >
                  <div className="ed-row gap-3 items-start">
                    <span className={`ed-row-icon ${tileTone} shrink-0`} aria-hidden>
                      <CtIcon name="receipt" size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{item.title}</p>
                      {item.subtitle ? (
                        <p className="text-xs opacity-80 mt-0.5">{item.subtitle}</p>
                      ) : null}
                      {item.meta ? (
                        <p className="text-[11px] opacity-60 mt-0.5">{item.meta}</p>
                      ) : null}
                    </span>
                    {selected ? (
                      <CtIcon name="check" size={18} className="shrink-0 text-[var(--ed-gold)]" />
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm opacity-75 ed-inset !p-3">{resolvedEmpty}</p>
      )}

      <div className="ed-stack-sm">
        <button type="button" onClick={onManual} className="ed-btn ed-btn-ghost w-full !text-sm">
          {resolvedManual}
        </button>
        {addLabel && onAdd ? (
          <Button type="button" variant="primary" className="w-full" onClick={onAdd}>
            {addLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
