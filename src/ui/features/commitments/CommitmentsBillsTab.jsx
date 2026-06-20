import { useMemo } from "react";
import {
  FilterChips,
  FilterChipsWithSearch,
  BillCard,
  Caption,
  Body,
  EmptyState,
  StatCard,
  Button,
} from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { suggestedCyclePaymentAmount } from "../../../utils/commitmentPayments.js";
import { computeBillPaymentProgress } from "../../../utils/billPaymentProgress.js";
import { scoreBillHealth, scoreAllBillsHealth, aggregateBillHealthScore } from "../../../engines/billHealth.js";
import { translateInsight } from "../../../i18n/insightLabels.js";
import { billHealthBandKey, billHealthSummaryKey } from "../../../i18n/scoreLabels.js";
import { Badge } from "../../primitives/Badge.jsx";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { formatInr } from "../../../constants/symbols.js";

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
  onAddCommitment,
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

  const monthlyCommitted = useMemo(
    () => activeBills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0),
    [activeBills],
  );

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
        <Body className="ct-body-strong inline-flex items-center">
          {t("bills.recurringBills.title")}
          <InfoTip textKey="bills.recurringBills.hint" />
        </Body>
        <Caption className="block mt-0.5">{t("bills.recurringBills.subtitle")}</Caption>
      </div>

      {activeBills.length > 0 && (
        <div className="ct-hero-card survival ct-bills-portfolio-hero">
          <div className="ct-hero-glow amber" aria-hidden />
          <div className="ct-row-between gap-2 flex-wrap items-start relative">
            <Caption className="inline-flex items-center font-semibold ct-hero-label !normal-case !tracking-normal">
              {t("bills.portfolioHealth")}
              <InfoTip text={CALC_HELP.billHealth} />
            </Caption>
            <Badge
              tone={
                portfolioHealth.band === "good" ? "success" : portfolioHealth.band === "watch" ? "warning" : "danger"
              }
            >
              {t(billHealthBandKey(portfolioHealth.band))}
            </Badge>
          </div>
          <Body className="!text-base ct-body-strong relative mt-2">
            {t(billHealthSummaryKey(portfolioHealth), {
              stress: portfolioHealth.stressCount,
              watch: portfolioHealth.watchCount,
            })}
          </Body>
          <Caption className="block text-[var(--ct-text-muted)] relative">
            {translateInsight(t, {
              id: portfolioHealth.insightId,
              params: {
                score: portfolioHealth.score,
                stress: portfolioHealth.stressCount,
                watch: portfolioHealth.watchCount,
              },
            })}
          </Caption>
          <Caption className="block opacity-75 relative">
            {t("bills.portfolioScoreDetail", { score: portfolioHealth.score })}
            {" · "}
            {t("bills.portfolioHealthHint")}
          </Caption>
        </div>
      )}

      <div className="ct-grid-2">
        <StatCard variant="tile" value={String(counts.pending || 0)} label={t("bills.due")} />
        <StatCard
          variant="tile"
          value={String(counts.upnext || 0)}
          label={t("bills.upNext")}
          valueClassName="text-[var(--ct-accent-muted)]"
        />
        <StatCard
          variant="tile"
          value={String(counts.overdue || 0)}
          label={t("bills.overdue")}
          valueClassName={counts.overdue > 0 ? "text-[var(--ct-warning)]" : undefined}
        />
        <StatCard
          variant="tile"
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

        <div className="ct-stack ct-list-animate">
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

      {activeBills.length > 0 && monthlyCommitted > 0 && (
        <div className="ct-hero-card pressure ct-bills-monthly-total">
          <div className="ct-hero-glow" aria-hidden />
          <p className="ct-hero-label">{t("bills.monthlyCommitted")}</p>
          <p className="ct-hero-number">{formatInr(monthlyCommitted)}</p>
        </div>
      )}

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
