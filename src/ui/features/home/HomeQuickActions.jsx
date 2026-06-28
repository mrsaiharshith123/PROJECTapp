import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";

/** Daily actions — bills, spends, goals, scan (no nav duplicates). */
export default function HomeQuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sortedCommitments, getEffectiveStatus, goals } = usePerovo();

  const pendingBills = useMemo(() => {
    return sortedCommitments.filter((c) => {
      const s = getEffectiveStatus(c);
      return s === "overdue" || s === "pending";
    }).length;
  }, [sortedCommitments, getEffectiveStatus]);

  const goalCount = (goals || []).length;

  const actions = [
    {
      icon: "receipt",
      label: t("home.quick.bills"),
      badge: pendingBills > 0 ? pendingBills : null,
      onTap: () => navigate("/ledger/bills"),
    },
    {
      icon: "arrows-down-up",
      label: t("home.quick.spends"),
      badge: null,
      onTap: () => navigate("/money/spends"),
    },
    {
      icon: "target",
      label: t("home.quick.goals"),
      badge: goalCount > 0 ? goalCount : null,
      onTap: () => navigate("/you/tools"),
    },
    {
      icon: "scan",
      label: t("home.quick.scan"),
      badge: null,
      onTap: () => navigate("/add?scan=true"),
    },
  ];

  return (
    <div className="ed-actions">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          className="ed-action-btn"
          onClick={a.onTap}
          aria-label={a.label}
        >
          {a.badge != null ? <span className="ed-action-badge">{a.badge}</span> : null}
          <span className="ed-action-ico">
            <CtIcon name={a.icon} size={18} />
          </span>
          <span className="ed-action-lbl">{a.label}</span>
        </button>
      ))}
    </div>
  );
}
