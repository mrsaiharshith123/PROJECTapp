import { useMemo } from "react";
import {
  FilterChips,
  FilterChipsWithSearch,
  BillCard,
  Caption,
  Body,
  EmptyState,
  StatCard,
} from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { suggestedCyclePaymentAmount } from "../../../utils/commitmentPayments.js";
import { computeBillPaymentProgress } from "../../../utils/billPaymentProgress.js";
import { scoreBillHealth, scoreAllBillsHealth, aggregateBillHealthScore } from "../../../engines/billHealth.js";
import { translateInsight } from "../../../i18n/insightLabels.js";
import { Badge } from "../../primitives/Badge.jsx";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";

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
  filterPreset,
  onFilterPresetChange,
  showHistory,
  onToggleHistory,
  onOpenDetail,
  onOpenPayment,
  onEdit,
  onDelete,
  dailySpends = [],
}) {
  const { t } = useTranslation();
  const stable = useStabilityIntel();
  const topStressorName = stable.stress?.top?.[0]?.name ?? null;

  const portfolioHealth = useMemo(() => {
    const scored = scoreAllBillsHealth(activeBills, (c) => c.effectiveStatus, {
      dailySpends,
      todayStr,
      topStressorName,
    });
    return aggregateBillHealthScore(scored);
  }, [activeBills, dailySpends, todayStr, topStressorName]);

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

  const categoryChips = [
    { id: "", label: t("bills.allCategories") },
    ...CATEGORY_OPTIONS.map(([value, key]) => ({ id: value, label: t(key) })),
  ];

  return (
    <div className="ct-stack">
      <div>
        <Body className="ct-body-strong">{t("bills.recurringBills.title")}</Body>
        <Caption className="block mt-0.5">{t("bills.recurringBills.subtitle")}</Caption>
        <Caption className="block mt-1 opacity-80">{t("bills.recurringBills.hint")}</Caption>
      </div>

      {activeBills.length > 0 && (
        <div className="ct-row-between gap-2 flex-wrap ct-inset !p-3">
          <div>
            <Caption className="block font-semibold">{t("bills.portfolioHealth")}</Caption>
            <Caption className="block mt-0.5 text-[var(--ct-text-muted)]">
              {translateInsight(t, {
                id: portfolioHealth.insightId,
                params: {
                  score: portfolioHealth.score,
                  stress: portfolioHealth.stressCount,
                  watch: portfolioHealth.watchCount,
                },
              })}
            </Caption>
          </div>
          <Badge
            tone={
              portfolioHealth.band === "good" ? "success" : portfolioHealth.band === "watch" ? "warning" : "danger"
            }
          >
            {portfolioHealth.score}/100
          </Badge>
        </div>
      )}

      <div className="ct-grid-2">
        <StatCard value={String(counts.pending || 0)} label={t("bills.due")} />
        <StatCard
          value={String(counts.upnext || 0)}
          label={t("bills.upNext")}
          valueClassName="text-[var(--ct-accent-muted)]"
        />
        <StatCard
          value={String(counts.overdue || 0)}
          label={t("bills.overdue")}
          valueClassName={counts.overdue > 0 ? "text-[var(--ct-warning)]" : undefined}
        />
        <StatCard
          value={String(historyBills.length)}
          label={t("bills.history")}
          valueClassName="text-[var(--ct-text-muted)]"
        />
      </div>

      <FilterChipsWithSearch
        options={presetChips}
        value={chipValue}
        onChange={onChipChange}
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={t("bills.searchPlaceholder")}
      />

      <FilterChips options={categoryChips} value={filterCategory} onChange={onFilterCategoryChange} />

      <div>
        <Body className="ct-body-strong mb-2">{t("bills.recurringBills.activeList")}</Body>

        {sortedCommitments.length === 0 && (
          <EmptyState icon="clipboard-text" title={copy.noBills} hint={t("bills.emptyHint", { action: copy.addBill })} />
        )}

        {sortedCommitments.length > 0 && activeBills.length === 0 && (
          <EmptyState icon="clipboard-text" title={t("bills.noMatchFilters")} hint={t("bills.recurringBills.clearFiltersHint")} />
        )}

        <div className="ct-stack">
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
      </div>

      {historyBills.length > 0 && (
        <div>
          <button type="button" onClick={onToggleHistory} className="ct-bill-card-head ct-body-strong">
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
    </div>
  );
}
