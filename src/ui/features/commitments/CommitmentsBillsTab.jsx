import {
  Card,
  FilterChips,
  CountTile,
  inputClassName,
  BillCard,
  Caption,
  EmptyState,
} from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { suggestedCyclePaymentAmount } from "../../../utils/commitmentPayments.js";
import { computeBillPaymentProgress } from "../../../utils/billPaymentProgress.js";

const CATEGORY_OPTIONS = [
  ["EMI", "category.emi"],
  ["Credit Card", "category.creditCard"],
  ["Subscription", "category.subscription"],
  ["Insurance", "category.insurance"],
  ["SIP", "category.sip"],
  ["Rent", "category.rent"],
  ["Loan", "category.loan"],
  ["Utility", "category.utility"],
  ["Other", "category.other"],
];

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
  filterPriority,
  onFilterPriorityChange,
  filterPreset,
  onFilterPresetChange,
  sortBy,
  onSortByChange,
  showHistory,
  onToggleHistory,
  onOpenDetail,
  onOpenPayment,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();

  const presetChips = [
    { id: "", label: t("bills.filterAll") },
    { id: "upcoming", label: t("bills.filterDueSoon") },
    { id: "overdue_only", label: t("bills.overdue") },
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

  return (
    <>
      <FilterChips options={presetChips} value={chipValue} onChange={onChipChange} />

      <div className="ct-grid-4">
        <CountTile value={counts.pending || 0} label={t("bills.due")} tone="warning" />
        <CountTile value={counts.upnext || 0} label={t("bills.upNext")} tone="info" />
        <CountTile value={counts.overdue || 0} label={t("bills.overdue")} tone="critical" />
        <CountTile
          value={historyBills.length}
          label={t("bills.history")}
          onClick={onToggleHistory}
        />
      </div>

      <Card className="ct-stack">
        <input
          type="search"
          placeholder={t("bills.searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={inputClassName()}
        />
        <div className="ct-grid-3">
          <select
            value={filterCategory}
            onChange={(e) => onFilterCategoryChange(e.target.value)}
            className={inputClassName("text-xs font-medium")}
          >
            <option value="">{t("bills.allCategories")}</option>
            {CATEGORY_OPTIONS.map(([value, key]) => (
              <option key={value} value={value}>
                {t(key)}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className={inputClassName("text-xs font-medium")}
          >
            <option value="">{t("bills.allStatuses")}</option>
            <option value="pending">{t("bills.statusDueNow")}</option>
            <option value="upnext">{t("bills.upNext")}</option>
            <option value="overdue">{t("bills.overdue")}</option>
            <option value="paid">{t("bills.paid")}</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => onFilterPriorityChange(e.target.value)}
            className={inputClassName("text-xs font-medium")}
          >
            <option value="">{t("bills.allPriorities")}</option>
            <option value="critical">{t("priority.critical")}</option>
            <option value="medium">{t("priority.medium")}</option>
            <option value="low">{t("priority.low")}</option>
          </select>
          <select
            value={filterPreset}
            onChange={(e) => onFilterPresetChange(e.target.value)}
            className={inputClassName("text-xs font-medium sm:col-span-2")}
          >
            <option value="">{t("bills.allTypes")}</option>
            <option value="recurring">{t("bills.recurringOnly")}</option>
            <option value="subscriptions">{t("bills.subscriptionsFilter")}</option>
            <option value="loans_emi">{t("bills.emiLoanFilter")}</option>
            <option value="overdue_only">{t("bills.overdue")}</option>
            <option value="upcoming">{t("bills.upcoming14d")}</option>
            <option value="high_remaining">{t("bills.highRemaining")}</option>
            <option value="high_pressure">{t("bills.highBurden")}</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className={inputClassName("text-xs font-medium sm:col-span-1")}
          >
            <option value="priority_due">{t("bills.sortPriorityDue")}</option>
            <option value="due_soonest">{t("bills.sortDueSoonest")}</option>
            <option value="burden_desc">{t("bills.sortBurdenDesc")}</option>
            <option value="remaining_desc">{t("bills.sortRemainingDesc")}</option>
            <option value="priority">{t("bills.sortPriority")}</option>
          </select>
        </div>
      </Card>

      {sortedCommitments.length === 0 && (
        <EmptyState
          icon="clipboard-text"
          title={copy.noBills}
          hint={t("bills.emptyHint", { action: copy.addBill })}
        />
      )}

      {sortedCommitments.length > 0 && activeBills.length === 0 && (
        <Card className="ct-stack-center" style={{ padding: "2rem 1.25rem", textAlign: "center" }}>
          <Caption>{t("bills.noMatchFilters")}</Caption>
        </Card>
      )}

      <div className="ct-stack">
        {activeBills.map((item) => {
          const eff = item.effectiveStatus;
          const total = Number(item.amount ?? 0);
          const cycleDue = suggestedCyclePaymentAmount(item, todayStr, commitments);
          const partial = (eff === "pending" || eff === "overdue") && cycleDue > 0 && cycleDue < total;
          const monthPaid = eff === "paid";
          const progress = computeBillPaymentProgress(item, todayStr, commitments);

          return (
            <BillCard
              key={item.id}
              item={item}
              effectiveStatus={eff}
              cycleDue={cycleDue}
              partial={partial}
              monthPaid={monthPaid}
              progress={progress}
              onOpen={() => onOpenDetail(item)}
              onPay={() => onOpenPayment(item)}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item.id)}
            />
          );
        })}
      </div>

      {historyBills.length > 0 && (
        <div>
          <button
            type="button"
            onClick={onToggleHistory}
            className="ct-bill-card-head ct-body-strong"
          >
            <span>{t("bills.historyCount", { count: historyBills.length })}</span>
            <span aria-hidden>{showHistory ? "\u25b2" : "\u25bc"}</span>
          </button>
          {showHistory && (
            <div className="ct-stack-sm mt-2">
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
      )}
    </>
  );
}
