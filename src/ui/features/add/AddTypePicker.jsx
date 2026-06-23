import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

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
    id: "agreement",
    icon: "handshake",
    labelKey: "add.category.agreement",
    subKey: "add.category.agreementSub",
    colorClass: "agreement",
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
    <div className="ct-stack">
      <p className="ct-add-pick-question">{t("add.category.question")}</p>
      <div className="ct-stack-sm">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`pos-tile ${c.colorClass} ct-pressable`}
            onClick={() => onSelect(c.id)}
            style={{
              width: "100%",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
              border: "none",
              textAlign: "left",
            }}
          >
            <span className={`ct-icon-tile pos-icon ${c.colorClass}`} style={{ flexShrink: 0 }}>
              <CtIcon name={c.icon} size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{t(c.labelKey)}</span>
              <span className="block text-xs text-[var(--pos-text-muted)] mt-0.5">{t(c.subKey)}</span>
            </span>
            <CtIcon name="caret-right" size={14} className="shrink-0 opacity-60" />
          </button>
        ))}
      </div>
    </div>
  );
}
