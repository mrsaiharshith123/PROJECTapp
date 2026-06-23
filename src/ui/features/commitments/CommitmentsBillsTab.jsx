import { useMemo, useState } from "react";
import {
  FilterChipsWithSearch,
  BillCard,
  Caption,
  Body,
  EmptyState,
  Button,
} from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { suggestedCyclePaymentAmount } from "../../../utils/commitmentPayments.js";
import { computeBillPaymentProgress } from "../../../utils/billPaymentProgress.js";
import { scoreBillHealth } from "../../../engines/billHealth.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { formatInr } from "../../../constants/symbols.js";
import BillsHeroSummary from "../money/BillsHeroSummary.jsx";
import BillsCategorySheet from "../money/BillsCategorySheet.jsx";
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
  counts,
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
  dailySpends = [],
  onAddCommitment,
  getEffectiveStatus: _getEffectiveStatus,
}) {
  const { t } = useTranslation();
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
    <div className="ct-stack ct-money-bills-list">
      <BillsHeroSummary activeBills={activeBills} counts={counts} />

      <FilterChipsWithSearch
        options={presetChips}
        value={chipValue}
        onChange={onChipChange}
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={t("bills.searchPlaceholder")}
      />

      <button type="button" className="ct-link !text-xs text-left w-fit" onClick={onToggleHistory}>
        {showHistory ? t("money.bills.hidePaidHistory") : t("money.bills.showPaidHistory")}
      </button>

      <button type="button" className="ct-settings-row ct-pressable" onClick={() => setCategoryOpen(true)}>
        <span className="ct-settings-row-label">{categoryLabel}</span>
        <CtIcon name="caret-right" size={14} className="ct-settings-row-caret shrink-0" aria-hidden />
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
              <Button type="button" onClick={onAddCommitment}>
                {t("bills.emptyAction")}
              </Button>
            ) : null
          }
        />
      )}

      {sortedCommitments.length > 0 && activeBills.length === 0 && (
        <EmptyState icon="clipboard-text" title={t("bills.noMatchFilters")} hint={t("bills.recurringBills.clearFiltersHint")} />
      )}

      <div className="ct-stack-sm ct-list-animate">
        {activeBills.map((item) => {
          const eff = item.effectiveStatus;
          const total = Number(item.amount ?? 0);
          const cycleDue = suggestedCyclePaymentAmount(item, todayStr, commitments);
          const partial = (eff === "pending" || eff === "overdue") && cycleDue > 0 && cycleDue < total;
          const monthPaid = eff === "paid";
          const progress = computeBillPaymentProgress(item, todayStr, commitments);
          const health = scoreBillHealth(item, {
            effectiveStatus: eff,
            dailySpends,
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
        <div className="ct-stat-tile teal ct-row-between gap-2 items-center">
          <Caption className="ct-stat-tile-label">{t("bills.monthlyCommitted")}</Caption>
          <Body className="ct-stat-tile-value ct-numeral">{formatInr(monthlyCommitted)}</Body>
        </div>
      )}

      {showHistory && historyBills.length > 0 && (
        <div className="ct-stack-sm">
          <Body className="ct-body-strong">{t("bills.historyCount", { count: historyBills.length })}</Body>
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
