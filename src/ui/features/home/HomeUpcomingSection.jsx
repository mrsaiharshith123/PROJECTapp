import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isActiveBill } from "../../../utils/billLifecycle.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { ScreenSection } from "../../layout/Screen.jsx";

function daysUntil(dueDate, todayStr) {
  if (!dueDate || !todayStr) return 999;
  const a = new Date(`${todayStr}T12:00:00`);
  const b = new Date(`${dueDate}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function attentionBillTitle(commitment) {
  if (commitment.category === "Insurance") {
    const company = String(commitment.insuranceCompany || "").trim();
    if (company) return company.length > 26 ? `${company.slice(0, 24)}…` : company;
    const id = String(commitment.insurancePolicyId || "").trim();
    if (id) return `Insurance · ${id.length > 8 ? id.slice(-8) : id}`;
  }
  const full = getBillDisplayName(commitment);
  return full.length > 28 ? `${full.slice(0, 26)}…` : full;
}

function UpcomingRow({ item, navigate, formatAmount }) {
  return (
    <button
      key={item.id}
      type="button"
      className="ct-attention-row upcoming w-full text-left"
      onClick={() => navigate(item.to)}
    >
      <div className="ct-row gap-3 min-w-0 flex-1 ct-attention-row-body">
        <span className="ct-icon-tile ct-home-attention-icon slate shrink-0">
          <CtIcon name="calendar" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="ct-body-strong truncate">{item.name}</p>
          <p className="ct-caption">{item.statusText}</p>
        </div>
        <span className="ct-numeral shrink-0">{formatAmount(item.amount)}</span>
      </div>
    </button>
  );
}

/** Bills due in 4–7 days — separate from requires-action section. */
export default function HomeUpcomingSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sortedCommitments, getEffectiveStatus, todayStr } = usePerovo();
  const { formatAmount } = usePrivacyAmount();

  const upcoming = useMemo(() => {
    const rows = [];
    for (const c of sortedCommitments) {
      if (rows.length >= 3) break;
      if (!isActiveBill(c, getEffectiveStatus, todayStr)) continue;
      const status = getEffectiveStatus(c);
      if (status !== "pending") continue;
      const days = daysUntil(c.dueDate, todayStr);
      if (days < 4 || days > 7) continue;
      rows.push({
        id: `upcoming-${c.id}`,
        name: attentionBillTitle(c),
        amount: Number(c.amount ?? 0),
        statusText: t("home.attention.inDays", { days }),
        to: "/money/bills",
      });
    }
    return rows;
  }, [sortedCommitments, getEffectiveStatus, todayStr, t]);

  if (!upcoming.length) return null;

  return (
    <ScreenSection title={t("home.comingUp")}>
      <div className="ct-stack-sm">
        {upcoming.map((item) => (
          <UpcomingRow key={item.id} item={item} navigate={navigate} formatAmount={formatAmount} />
        ))}
      </div>
    </ScreenSection>
  );
}
