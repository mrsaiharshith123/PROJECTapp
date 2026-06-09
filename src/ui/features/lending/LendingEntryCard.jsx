import { Card } from "../../index.js";
import { formatInr } from "../../../constants/symbols.js";
import { getEffectiveLendingStatus } from "../../../utils/lendingStatus.js";
import { trustScoreForLendingEntry, trustScoreToTone } from "../../../engines/lendingTrust.js";
import { semanticToneToClass } from "../../tokens/semanticBadge.js";
import { canDeleteLending, canEditLending } from "../../../engines/lendingAgreement.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateLendingStatus, translateRepaymentMode } from "../../../i18n/domainLabels.js";

const lendingStatusClasses = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  complete: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function avatarFor(name) {
  const s = String(name || "?").trim();
  return (s[0] || "?").toUpperCase();
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
  const statusClasses = lendingStatusClasses[eff] || lendingStatusClasses.pending;
  const trust = trustScoreForLendingEntry(item);

  return (
    <Card key={item.id} className={eff === "overdue" ? "border-red-100 bg-red-50/50" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold bg-indigo-100 text-indigo-700 shrink-0">
            {avatarFor(item.personName)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-gray-800">{item.personName}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${semanticToneToClass(trustScoreToTone(trust))}`}>
                {trust}/100
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("lending.dueLine", { date: formatDate(item.dueDate) })} ·{" "}
              {translateRepaymentMode(t, item.repaymentType || item.repaymentFrequency)}
            </p>
            {item.agreementAccepted && item.agreementLocked && eff !== "complete" && (
              <p className="text-[10px] text-amber-700 mt-0.5">{t("lending.agreementLocked")}</p>
            )}
            {item.notes ? <p className="text-xs text-gray-400 mt-1">{item.notes}</p> : null}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>
            {formatInr(item.totalAmount)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("lending.left", { amount: formatInr(item.remainingAmount) })}
          </p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold border ${statusClasses}`}>
            {translateLendingStatus(t, eff)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
        {eff !== "complete" && (
          <button
            type="button"
            onClick={() => onPayment(item)}
            className="flex-1 min-w-0 py-2 text-xs font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            {t("lending.payment")}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDetail(item)}
          className="px-3 py-2 text-xs font-semibold border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50"
        >
          {t("lending.details")}
        </button>
        {canEditLending(item) ? (
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="px-3 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {t("common.edit")}
          </button>
        ) : null}
        {canDeleteLending(item) ? (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
          >
            {t("common.delete")}
          </button>
        ) : (
          <span className="px-2 py-2 text-[10px] text-amber-700" title={t("lending.lockedTitle")}>
            {t("lending.locked")}
          </span>
        )}
      </div>
    </Card>
  );
}
