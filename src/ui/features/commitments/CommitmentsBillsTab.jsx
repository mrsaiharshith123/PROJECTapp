import { useMemo, useState } from "react";
import { BillCard, EmptyState } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { suggestedCyclePaymentAmount } from "../../../utils/commitmentPayments.js";
import { computeBillPaymentProgress } from "../../../utils/billPaymentProgress.js";
import { scoreBillHealth } from "../../../engines/billHealth.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import BillsCategorySheet from "./BillsCategorySheet.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";

const CATEGORY_LABEL_KEYS = {
  EMI: "category.emi",
  "Credit Card": "category.creditCard",
  Subscription: "category.subscription",
  Insurance: "category.insurance",
  SIP: "category.sip",
  Rent: "category.rent",
  Loan: "category.loan",
  Utility: "category.utility",
  Other: "category.other",
};

export default function CommitmentsBillsTab({
  copy,
  sortedCommitments,
  commitments,
  todayStr,
  activeBills,
  historyBills,
  counts: _counts,
  search,
  onSearchChange,
  filterCategory,
  onFilterCategoryChange,
  filterStatus,
  onFilterStatusChange,
  filterPreset,
  onFilterPresetChange,
  showHistory,
  onToggleHistory,
  onOpenDetail,
  onOpenPayment,
  onEdit,
  onDelete,
  onAddCommitment,
  getEffectiveStatus: _getEffectiveStatus,
}) {
  const { t } = useTranslation();
  const { formatAmount } = usePrivacyAmount();
  const stable = useStabilityIntel();
  const topStressorName = stable.stress?.top?.[0]?.name ?? null;
  const [categoryOpen, setCategoryOpen] = useState(false);

  const monthlyCommitted = useMemo(
    () => activeBills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0),
    [activeBills],
  );

  const presetChips = [
    { id: "", label: t("bills.filterAll") },
    { id: "overdue_only", label: t("bills.overdue") },
    { id: "upcoming", label: t("bills.filterDueSoon") },
    { id: "paid", label: t("bills.paid") },
  ];

  const chipValue =
    filterPreset === "overdue_only"
      ? "overdue_only"
      : filterPreset === "upcoming"
        ? "upcoming"
        : filterStatus === "paid"
          ? "paid"
          : "";

  const onChipChange = (id) => {
    if (id === "overdue_only") {
      onFilterPresetChange("overdue_only");
      onFilterStatusChange("");
    } else if (id === "upcoming") {
      onFilterPresetChange("upcoming");
      onFilterStatusChange("");
    } else if (id === "paid") {
      onFilterPresetChange("");
      onFilterStatusChange("paid");
    } else {
      onFilterPresetChange("");
      onFilterStatusChange("");
    }
  };

  const categoryLabel = filterCategory
    ? t(CATEGORY_LABEL_KEYS[filterCategory] || "category.other")
    : showHistory
      ? t("money.bills.categoryWithHistory")
      : t("money.bills.filterCategoryRow");

  return (
    <div className="ed-section ed-section--flush">
      <div className="ed-filter-row">
        {presetChips.map((chip) => (
          <button
            key={chip.id || "all"}
            type="button"
            className={`ed-btn ed-btn-sm ${chipValue === chip.id ? "ed-btn-primary" : "ed-btn-ghost"}`}
            onClick={() => onChipChange(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="ed-field" style={{ marginTop: 10 }}>
        <input
          className="ed-input"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("bills.searchPlaceholder")}
        />
      </div>

      <button type="button" className="ed-btn-link" style={{ marginTop: 8, fontSize: 12 }} onClick={onToggleHistory}>
        {showHistory ? t("money.bills.hidePaidHistory") : t("money.bills.showPaidHistory")}
      </button>

      <button type="button" className="ed-row ed-row-press" style={{ marginTop: 8 }} onClick={() => setCategoryOpen(true)}>
        <span className="ed-row-title">{categoryLabel}</span>
        <CtIcon name="caret-right" size={14} className="ed-icon-muted" />
      </button>

      <BillsCategorySheet
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        value={filterCategory}
        onChange={onFilterCategoryChange}
        showHistory={showHistory}
        onToggleHistory={onToggleHistory}
      />

      {sortedCommitments.length === 0 && (
        <EmptyState
          icon="clipboard-text"
          title={copy.noBills}
          message={t("bills.emptyHint", { action: copy.addBill })}
          action={
            onAddCommitment ? (
              <button type="button" className="ed-btn ed-btn-primary" onClick={onAddCommitment}>
                {t("bills.emptyAction")}
              </button>
            ) : null
          }
        />
      )}

      {sortedCommitments.length > 0 && activeBills.length === 0 && (
        <EmptyState icon="clipboard-text" title={t("bills.noMatchFilters")} hint={t("bills.recurringBills.clearFiltersHint")} />
      )}

      <div className="ed-section" style={{ paddingTop: 0 }}>
        {activeBills.map((item) => {
          const eff = item.effectiveStatus;
          const total = Number(item.amount ?? 0);
          const cycleDue = suggestedCyclePaymentAmount(item, todayStr, commitments);
          const partial = (eff === "pending" || eff === "overdue") && cycleDue > 0 && cycleDue < total;
          const monthPaid = eff === "paid";
          const progress = computeBillPaymentProgress(item, todayStr, commitments);
          const health = scoreBillHealth(item, {
            effectiveStatus: eff,
            todayStr,
            topStressorName,
          });

          return (
            <BillCard
              key={item.id}
              item={item}
              effectiveStatus={eff}
              cycleDue={cycleDue}
              partial={partial}
              monthPaid={monthPaid}
              progress={progress}
              health={health}
              onOpen={() => onOpenDetail(item)}
              onPay={() => onOpenPayment(item)}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          );
        })}
      </div>

      {activeBills.length > 0 && monthlyCommitted > 0 && (
        <div className="ed-metric">
          <div className="ed-metric-label">{t("bills.monthlyCommitted")}</div>
          <div className="ed-metric-value">{formatAmount(monthlyCommitted)}</div>
        </div>
      )}

      {showHistory && historyBills.length > 0 && (
        <div className="ed-section">
          <p className="ed-row-title">{t("bills.historyCount", { count: historyBills.length })}</p>
          {historyBills.map((item) => {
            const hp = computeBillPaymentProgress(item, todayStr, commitments);
            return (
              <BillCard
                key={item.id}
                variant="history"
                item={item}
                effectiveStatus="paid"
                cycleDue={0}
                partial={false}
                monthPaid={false}
                progress={hp}
                onOpen={() => onOpenDetail(item)}
                onPay={() => {}}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
