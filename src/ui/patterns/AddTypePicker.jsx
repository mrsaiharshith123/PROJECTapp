import { useTranslation } from "../../i18n/I18nProvider.js";
import { CtIcon } from "../icons/CtIcon.jsx";

const CATEGORIES = [
  {
    id: "asset",
    icon: "chart-line-up",
    labelKey: "add.category.asset",
    subKey: "add.category.assetSub",
    colorClass: "asset",
  },
  {
    id: "liability",
    icon: "chart-line-down",
    labelKey: "add.category.liability",
    subKey: "add.category.liabilitySub",
    colorClass: "liability",
  },
  {
    id: "instrument",
    icon: "shield",
    labelKey: "add.category.instrument",
    subKey: "add.category.instrumentSub",
    colorClass: "instrument",
  },
  {
    id: "goal",
    icon: "target",
    labelKey: "add.category.goal",
    subKey: "add.category.goalSub",
    colorClass: "goal",
  },
  {
    id: "cashflow",
    icon: "arrow-down-right",
    labelKey: "add.category.cashflow",
    subKey: "add.category.cashflowSub",
    colorClass: "cashflow",
  },
];

/**
 * Step 1 — pick ledger category (Position OS model).
 * @param {{ onSelect: (id: string) => void }} props
 */
export default function AddTypePicker({ onSelect }) {
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <p className="ed-add-pick-title">{t("add.category.question")}</p>
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          type="button"
          className="ed-row ed-row-press ed-add-pick-row"
          onClick={() => onSelect(c.id)}
        >
          <span className={`ed-icon-tile ed-icon-tile-lg pos-icon ${c.colorClass}`} aria-hidden>
            <CtIcon name={c.icon} size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="ed-add-pick-label">{t(c.labelKey)}</span>
            <span className="ed-add-pick-sub">{t(c.subKey)}</span>
          </span>
          <CtIcon name="caret-right" size={14} className="shrink-0" style={{ color: "var(--ed-ink-zero)" }} />
        </button>
      ))}
    </div>
  );
}
