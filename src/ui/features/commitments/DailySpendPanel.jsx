import { useMemo, useState } from "react";
import { format, subDays, parseISO } from "date-fns";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";
import { useResolvedTheme } from "../../../hooks/useResolvedTheme.js";
import {
  dailySpendByLifeCategory,
  dailySpendByMerchant,
  dailySpendTrendByDay,
  sumDailySpendsInRange,
} from "../../../utils/dailySpends.js";
import { getTransactionLifeCategoryMeta, TRANSACTION_LIFE_CATEGORIES } from "../../../constants/transactionCategories.js";
import { formatInr } from "../../../constants/symbols.js";
import { FlexibleDataChart } from "../analytics/charts/FlexibleDataChart.jsx";

/** @typedef {import("../analytics/charts/FlexibleDataChart.jsx").ChartTypeId} ChartTypeId */
import { ChartTypeSelect } from "../analytics/charts/ChartTypeSelect.jsx";
import {
  Card,
  Stack,
  Button,
  Caption,
  Body,
  EmptyState,
  FilterChips,
  ChartShell,
  StatCard,
  Badge,
} from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const LIFE_ICONS = {
  survival: "shield",
  lifestyle: "fork-knife",
  growth: "chart-line-up",
  pressure: "hourglass",
  risk: "warning",
};

function formatSpendDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return format(parseISO(`${dateStr}T12:00:00`), "d MMM yyyy");
  } catch {
    return dateStr;
  }
}

/** Variable spend logs — history, charts with type switcher, period filters. */
export default function DailySpendPanel() {
  const { dailySpends, deleteDailySpend, todayStr } = useCommitTrack();
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const [period, setPeriod] = useState("30d");
  const [chartMode, setChartMode] = useState("category");
  /** @type {[ChartTypeId, import('react').Dispatch<import('react').SetStateAction<ChartTypeId>>]} */
  const [chartType, setChartType] = useState(/** @type {ChartTypeId} */ ("donut"));
  const [lifeFilter, setLifeFilter] = useState("");

  const range = useMemo(() => {
    const end = todayStr;
    if (period === "7d") {
      return { start: format(subDays(parseISO(`${todayStr}T12:00:00`), 6), "yyyy-MM-dd"), end };
    }
    if (period === "30d") {
      return { start: format(subDays(parseISO(`${todayStr}T12:00:00`), 29), "yyyy-MM-dd"), end };
    }
    const dates = (dailySpends || []).map((s) => s.date).filter(Boolean);
    if (!dates.length) return { start: todayStr, end };
    dates.sort();
    return { start: dates[0], end: dates[dates.length - 1] };
  }, [period, todayStr, dailySpends]);

  const periodSpends = useMemo(
    () =>
      (dailySpends || []).filter((s) => s.date && s.date >= range.start && s.date <= range.end),
    [dailySpends, range],
  );

  const total = useMemo(
    () => sumDailySpendsInRange(dailySpends, range.start, range.end),
    [dailySpends, range],
  );

  const breakdownData = useMemo(() => {
    if (chartMode === "category") {
      return dailySpendByLifeCategory(dailySpends, range.start, range.end).map(({ lifeCategory, amount }) => ({
        name: getTransactionLifeCategoryMeta(lifeCategory).label,
        value: amount,
        id: lifeCategory,
      }));
    }
    const merchants = dailySpendByMerchant(dailySpends, range.start, range.end);
    const top = merchants.slice(0, 7).map((m) => ({ name: m.label, value: m.amount }));
    const other = merchants.slice(7).reduce((s, m) => s + m.amount, 0);
    if (other > 0) top.push({ name: t("bills.dailySpend.otherMerchants"), value: other });
    return top;
  }, [chartMode, dailySpends, range, t]);

  const trendData = useMemo(
    () => dailySpendTrendByDay(dailySpends, range.start, range.end),
    [dailySpends, range],
  );

  const listSpends = useMemo(() => {
    let rows = [...periodSpends];
    if (lifeFilter) rows = rows.filter((s) => s.lifeCategory === lifeFilter);
    return rows.sort((a, b) => {
      const d = (b.date || "").localeCompare(a.date || "");
      if (d !== 0) return d;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [periodSpends, lifeFilter]);

  const periodOptions = [
    { id: "7d", label: t("bills.dailySpend.period7d") },
    { id: "30d", label: t("bills.dailySpend.period30d") },
    { id: "all", label: t("bills.dailySpend.periodAll") },
  ];

  const chartOptions = [
    { id: "category", label: t("bills.dailySpend.chartCategory") },
    { id: "merchant", label: t("bills.dailySpend.chartMerchant") },
  ];

  const lifeFilterOptions = [
    { id: "", label: t("bills.dailySpend.allCategories") },
    ...TRANSACTION_LIFE_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ];

  const useTrend = (chartType === "line" || chartType === "bar") && trendData.length > 0;
  const plotData = useTrend ? trendData : breakdownData;
  /** @type {ChartTypeId} */
  const plotType = useTrend ? (chartType === "line" ? "line" : "bar") : chartType;

  return (
    <div className="ct-stack">
      <div>
        <Body className="ct-body-strong">{t("bills.variableSpend.title")}</Body>
        <Caption className="block mt-0.5">{t("bills.variableSpend.subtitle")}</Caption>
      </div>

      <div className="ct-grid-2">
        <StatCard value={formatInr(total)} label={t("bills.dailySpend.total")} />
        <StatCard
          value={String(periodSpends.length)}
          label={t("bills.dailySpend.entries")}
          valueClassName="text-[var(--ct-accent-muted)]"
        />
      </div>

      <FilterChips options={periodOptions} value={period} onChange={setPeriod} />
      <FilterChips options={chartOptions} value={chartMode} onChange={setChartMode} />

      <div className="ct-row-between" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        <Caption>{t("charts.sameDataHint")}</Caption>
        <ChartTypeSelect value={chartType} onChange={setChartType} />
      </div>

      <ChartShell
        title={
          chartMode === "category"
            ? t("bills.dailySpend.chartCategoryTitle")
            : t("bills.dailySpend.chartMerchantTitle")
        }
        hint={t("bills.dailySpend.chartHint")}
        height={220}
        compact
      >
        <FlexibleDataChart
          data={plotData}
          chartType={plotType}
          theme={theme}
          emptyMessage={t("bills.dailySpend.chartEmpty")}
        />
      </ChartShell>

      <div>
        <Body className="ct-body-strong mb-2">{t("bills.dailySpend.history")}</Body>
        <FilterChips options={lifeFilterOptions} value={lifeFilter} onChange={setLifeFilter} />
      </div>

      {listSpends.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={t("bills.dailySpend.empty")}
          hint={t("bills.dailySpend.emptyHint")}
        />
      ) : (
        <Stack gap="sm" className="ct-list-animate">
          {listSpends.map((spend) => {
            const life = getTransactionLifeCategoryMeta(spend.lifeCategory);
            const icon = LIFE_ICONS[spend.lifeCategory] || "receipt";
            return (
              <Card key={spend.id} variant="flat" className="ct-daily-spend-row">
                <div className="ct-row-between gap-3">
                  <div className="ct-row min-w-0 flex-1">
                    <span className="ct-icon-box shrink-0">
                      <CtIcon name={icon} size={20} context="category" />
                    </span>
                    <div className="min-w-0">
                      <Body className="font-semibold truncate block">{spend.label}</Body>
                      <Caption className="block">
                        {formatSpendDate(spend.date)}
                        {spend.source === "sms" ? ` · ${t("bills.dailySpend.fromSms")}` : ""}
                      </Caption>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Body className="ct-numeral font-bold block">{formatInr(spend.amount)}</Body>
                    <Badge tone="neutral" className="mt-1">
                      {life.label}
                    </Badge>
                  </div>
                </div>
                <div className="ct-row-between mt-2 pt-2 border-t border-white/5">
                  <Caption className="truncate">
                    {spend.merchantId && spend.merchantId !== spend.label.toLowerCase()
                      ? spend.merchantId.replace(/_/g, " ")
                      : t("bills.dailySpend.manualEntry")}
                  </Caption>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="!w-auto !py-1 !px-2 text-[var(--ct-danger)]"
                    onClick={() => deleteDailySpend(spend.id)}
                  >
                    {t("bills.dailySpend.delete")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </Stack>
      )}
    </div>
  );
}
