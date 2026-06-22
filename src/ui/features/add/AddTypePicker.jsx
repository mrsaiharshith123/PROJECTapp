import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const OPTIONS = [
  { id: "bill", icon: "clipboard-text", titleKey: "add.pick.bill", descKey: "add.pick.billDesc", tone: "indigo" },
  { id: "spend", icon: "fork-knife", titleKey: "add.pick.spend", descKey: "add.pick.spendDesc", tone: "teal" },
  { id: "lending", icon: "handshake", titleKey: "add.pick.lending", descKey: "add.pick.lendingDesc", tone: "indigo" },
];

/**
 * Step 1 — what are you adding?
 * @param {{ onSelect: (id: string) => void }} props
 */
export default function AddTypePicker({ onSelect }) {
  const { t } = useTranslation();

  return (
    <div className="ct-stack">
      <p className="ct-add-pick-question">{t("add.pick.question")}</p>
      <div className="ct-add-type-grid">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`ct-stat-tile ${opt.tone} ct-add-type-stat-tile ct-pressable`}
            onClick={() => onSelect(opt.id)}
          >
            <span className="ct-icon-tile ct-icon-tile-sm indigo shrink-0" aria-hidden>
              <CtIcon name={opt.icon} size={20} weight="duotone" />
            </span>
            <span className="ct-add-type-title">{t(opt.titleKey)}</span>
            <span className="ct-add-type-desc">{t(opt.descKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
