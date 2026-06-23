import { memo } from "react";
import { getEffectiveLendingStatus } from "../../../utils/lendingStatus.js";
import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateLendingStatus } from "../../../i18n/domainLabels.js";
import { cn } from "../../utils/cn.js";

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

function daysUntil(dueDate, todayStr) {
  if (!dueDate || !todayStr) return 999;
  const a = new Date(`${todayStr}T12:00:00`);
  const b = new Date(`${dueDate}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function trustFilledDots(score) {
  return Math.min(5, Math.max(0, Math.round((Number(score) || 0) / 20)));
}

/**
 * Agreement row card — trust dots, status stripe, legal + repayment actions.
 */
function AgreementCard({ item, todayStr, trustScore = 50, onMakeLegal, onRepayment }) {
  const { t } = useTranslation();
  const eff = getEffectiveLendingStatus(item, todayStr);
  const filled = trustFilledDots(trustScore);
  const days = daysUntil(item.dueDate, todayStr);
  const dueSoon = eff === "pending" && days >= 0 && days <= 3;

  const stripeTone = eff === "overdue" ? "rose" : dueSoon ? "amber" : "teal";
  const lentLabel = item.type === "lent" ? t("agreements.lentOn") : t("agreements.borrowedOn");

  return (
    <article className={cn("pos-agreement-card", `stripe-${stripeTone}`)}>
      <div className="pos-agreement-card-body">
        <div className="pos-agreement-card-top">
          <span className="pos-agreement-avatar" aria-hidden>
            {initials(item.personName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="pos-agreement-name">{item.personName}</p>
            <p className="pos-agreement-meta">
              {formatInr(item.totalAmount)} · {lentLabel} {formatShortDate(item.startDate || item.dueDate)} ·{" "}
              {t("agreements.due")} {formatShortDate(item.dueDate)}
            </p>
            <div className="pos-trust-dots" aria-label={t("agreements.trustScoreAria", { score: trustScore })}>
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={cn("pos-trust-dot", i < filled && "filled")} />
              ))}
            </div>
            <p
              className={cn(
                "pos-agreement-status",
                eff === "overdue" && "rose",
                eff === "pending" && !dueSoon && "teal",
                dueSoon && "amber",
                eff === "complete" && "teal",
              )}
            >
              {eff === "overdue" && days < 0
                ? t("agreements.overdueDays", { days: Math.abs(days) })
                : translateLendingStatus(t, eff)}
            </p>
          </div>
        </div>
        {eff !== "complete" ? (
          <div className="pos-agreement-actions">
            <button type="button" className="pos-agreement-btn legal" onClick={() => onMakeLegal(item)}>
              {item.agreementLocked ? t("agreements.viewLegal") : t("agreements.makeLegal")}
            </button>
            <button type="button" className="pos-agreement-btn ghost" onClick={() => onRepayment(item)}>
              {t("agreements.repayment")}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default memo(AgreementCard);
