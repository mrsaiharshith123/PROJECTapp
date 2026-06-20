import { Card, Button } from "../../index.js";
import { formatInr } from "../../../constants/symbols.js";
import { getEffectiveLendingStatus } from "../../../utils/lendingStatus.js";
import { trustScoreForLendingEntry, trustScoreToTone } from "../../../engines/lendingTrust.js";
import { semanticToneToClass } from "../../tokens/semanticBadge.js";
import { statusTone } from "../../utils/statusColor.js";
import { cn } from "../../utils/cn.js";
import { canDeleteLending, canEditLending } from "../../../engines/lendingAgreement.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateLendingStatus, translateRepaymentMode } from "../../../i18n/domainLabels.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const lendingStatusTone = {
  pending: "warning",
  overdue: "danger",
  complete: "success",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function LendingEntryCard({
  item,
  todayStr,
  onPayment,
  onDetail,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();
  const eff = getEffectiveLendingStatus(item, todayStr);
  const statusToneKey = lendingStatusTone[eff] || statusTone(eff);
  const trust = trustScoreForLendingEntry(item);
  const isOverdue = eff === "overdue";

  return (
    <Card
      key={item.id}
      variant={isOverdue ? "status-overdue" : "default"}
      className={cn("ct-pressable ct-card-status", isOverdue && "ct-card-status-overdue")}
    >
      <div className="ct-lending-entry-row">
        <div className="ct-row gap-3 min-w-0 flex-1">
          <span className={cn("ct-icon-tile shrink-0", isOverdue ? "danger" : "indigo")} aria-hidden>
            <CtIcon name="handshake" size={20} context="category" />
          </span>
          <div className="min-w-0">
            <div className="ct-row flex-wrap gap-2 items-center">
              <p className="font-semibold text-[var(--ct-text)] truncate">{item.personName}</p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${semanticToneToClass(trustScoreToTone(trust))}`}
              >
                {trust}/100
              </span>
            </div>
            <p className="ct-caption mt-0.5">
              {t("lending.dueLine", { date: formatDate(item.dueDate) })} ·{" "}
              {translateRepaymentMode(t, item.repaymentType || item.repaymentFrequency)}
            </p>
            {item.agreementAccepted && item.agreementLocked && eff !== "complete" ? (
              <p className="ct-caption ct-text-warning mt-0.5">{t("lending.agreementLocked")}</p>
            ) : null}
          </div>
        </div>
        <div className="ct-stat-tile indigo shrink-0 text-right min-w-[6.5rem]">
          <p className="ct-stat-tile-value ct-numeral">{formatInr(item.totalAmount)}</p>
          <p className="ct-stat-tile-label mt-0.5">
            {t("lending.left", { amount: formatInr(item.remainingAmount) })}
          </p>
          <span className={cn("ct-status mt-1 inline-block", semanticToneToClass(statusToneKey))}>
            {translateLendingStatus(t, eff)}
          </span>
        </div>
      </div>
      <div className="ct-row-wrap gap-2 mt-3 pt-3 border-t border-[var(--ct-border)]">
        {eff !== "complete" ? (
          <Button type="button" variant="primary" size="sm" className="flex-1 min-w-0" onClick={() => onPayment(item)}>
            {t("lending.payment")}
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={() => onDetail(item)}>
          {t("lending.details")}
        </Button>
        {canEditLending(item) ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(item)}>
            {t("common.edit")}
          </Button>
        ) : null}
        {canDeleteLending(item) ? (
          <Button type="button" variant="danger" size="sm" onClick={() => onDelete(item.id)}>
            {t("common.delete")}
          </Button>
        ) : (
          <span className="px-2 py-2 ct-caption ct-text-warning" title={t("lending.lockedTitle")}>
            {t("lending.locked")}
          </span>
        )}
      </div>
    </Card>
  );
}
