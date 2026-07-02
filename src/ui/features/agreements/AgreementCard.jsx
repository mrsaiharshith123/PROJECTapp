import { memo } from "react";
import { getEffectiveLendingStatus } from "../../../utils/lendingStatus.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateLendingStatus } from "../../../i18n/domainLabels.js";
import { daysUntil } from "../../../utils/dates.js";

function initials(name) {
  const parts = String(name || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatShortDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function trustFilledDots(score) {
  return Math.min(5, Math.max(0, Math.round((Number(score) || 0) / 20)));
}

function lendingTypeLabel(t, type) {
  return type === "borrowed" ? t("agreements.borrowedOn") : t("agreements.lentOn");
}

/**
 * Agreement row card — trust dots, status stripe, legal + repayment actions.
 */
function AgreementCard({ item, todayStr, trustScore = 50, onMakeLegal, onRepayment }) {
  const { t } = useTranslation();
  const { formatAmount } = usePrivacyAmount();
  const eff = getEffectiveLendingStatus(item, todayStr);
  const filled = trustFilledDots(trustScore);
  const days = daysUntil(item.dueDate, todayStr);
  const dueSoon = eff === "pending" && days >= 0 && days <= 3;

  const stripeColor =
    eff === "overdue"
      ? "var(--ed-red)"
      : eff === "pending" && dueSoon
        ? "var(--ed-gold)"
        : eff === "complete"
          ? "var(--ed-green)"
          : "var(--ed-rule)";

  const statusLabel =
    eff === "overdue" && days < 0
      ? t("agreements.overdueDays", { days: Math.abs(days) })
      : translateLendingStatus(t, eff);

  return (
    <div className="ed-agreement-card">
      <div aria-hidden className="ed-agreement-stripe" style={{ background: stripeColor }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0, flex: 1 }}>
          <div className="ed-agreement-avatar" aria-hidden>
            {initials(item.personName)}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="ed-agreement-name">{item.personName}</div>
            <div className="ed-agreement-meta">
              {lendingTypeLabel(t, item.type)}
              {item.dueDate ? ` · ${t("agreements.due")} ${formatShortDate(item.dueDate)}` : ""}
            </div>
            <div style={{ display: "flex", gap: 3, marginTop: 5 }} aria-label={t("agreements.trustScoreAria", { score: trustScore })}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`ed-trust-dot${i < filled ? " filled" : ""}`} />
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            flexShrink: 0,
            marginLeft: 10,
          }}
        >
          <div className={`ed-agreement-amount${eff === "overdue" ? " overdue" : ""}`}>
            {formatAmount(Number(item.remainingAmount ?? item.totalAmount) || 0)}
          </div>
          <div
            className={`ed-agreement-status${eff === "overdue" ? " overdue" : ""}${eff === "complete" ? " complete" : ""}`}
          >
            {statusLabel}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            {(eff === "pending" || eff === "overdue") && onRepayment ? (
              <button type="button" className="ed-agreement-action gold" onClick={() => onRepayment(item)}>
                {t("agreements.ed.recordPayment")}
              </button>
            ) : null}
            {onMakeLegal ? (
              <button type="button" className="ed-agreement-action muted" onClick={() => onMakeLegal(item)}>
                {t("agreements.ed.legalDoc")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(AgreementCard);
