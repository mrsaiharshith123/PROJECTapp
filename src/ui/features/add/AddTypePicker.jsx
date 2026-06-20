import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const OPTIONS = [
  { id: "bill", icon: "clipboard-text", titleKey: "add.pick.bill", descKey: "add.pick.billDesc" },
  { id: "spend", icon: "fork-knife", titleKey: "add.pick.spend", descKey: "add.pick.spendDesc" },
  { id: "lending", icon: "handshake", titleKey: "add.pick.lending", descKey: "add.pick.lendingDesc" },
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
            className="ct-add-type-card"
            onClick={() => onSelect(opt.id)}
          >
            <span className="ct-add-type-icon">
              <CtIcon name={opt.icon} size={28} />
            </span>
            <span className="ct-add-type-title">{t(opt.titleKey)}</span>
            <span className="ct-add-type-desc">{t(opt.descKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
