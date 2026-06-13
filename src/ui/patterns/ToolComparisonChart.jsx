import { useMemo } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { useResolvedTheme } from "../../hooks/useResolvedTheme.js";
import { getChartTheme } from "../tokens/chartTheme.js";
import { ChartShell } from "./ChartShell.jsx";
import { FlexibleDataChart } from "../features/analytics/charts/FlexibleDataChart.jsx";
import { Caption, Body } from "../primitives/Text.jsx";
import { formatInr } from "../../constants/symbols.js";

/**
 * Baseline vs what-if comparison chart for dashboard tools.
 */
export function ToolComparisonChart({
  data,
  titleKey,
  baselineLabelKey,
  whatIfLabelKey,
  emptyKey = "charts.emptyComparison",
  hintKey = "charts.comparisonHint",
  scoreChart = false,
  extraCaption = null,
  xKey = "name",
  baselineKey = "baseline",
  whatIfKey = "whatIf",
  showPaymentTooltip = false,
  yDomainTight = false,
  singleSeriesWhenEqual = false,
}) {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const chartColors = getChartTheme(theme);

  const displayData = useMemo(
    () =>
      (data || []).map((row) => {
        const raw = row[xKey];
        const name =
          raw != null && !String(raw).startsWith("_")
            ? String(raw)
            : row.month != null
              ? String(row.month)
              : String(raw ?? "");
        return { ...row, name };
      }),
    [data, xKey],
  );

  const pathsDiffer = useMemo(
    () => displayData.some((r) => r[baselineKey] !== r[whatIfKey]),
    [displayData, baselineKey, whatIfKey],
  );

  const seriesKeys = useMemo(() => {
    const baseline = {
      key: baselineKey,
      name: t(baselineLabelKey),
      color: chartColors.series.accentSoft,
    };
    if (singleSeriesWhenEqual && !pathsDiffer) return [baseline];
    return [
      baseline,
      { key: whatIfKey, name: t(whatIfLabelKey), color: chartColors.series.success },
    ];
  }, [
    baselineKey,
    whatIfKey,
    baselineLabelKey,
    whatIfLabelKey,
    chartColors,
    t,
    pathsDiffer,
    singleSeriesWhenEqual,
  ]);

  const paymentTooltip = useMemo(() => {
    if (!showPaymentTooltip) return undefined;
    return ({ active, payload, label }) => {
      if (!active || !payload?.length) return null;
      const row = payload[0]?.payload;
      if (!row) return null;
      const baselinePt = payload.find((p) => p.dataKey === baselineKey);
      const whatIfPt = payload.find((p) => p.dataKey === whatIfKey);
      return (
        <div className="ct-chart-tooltip">
          <p className="ct-chart-tooltip-title">{label}</p>
          {row.emiPay > 0 ? (
            <p>
              {t("loan.advisor.tooltipEmi")}: {formatInr(row.emiPay)}
            </p>
          ) : null}
          {row.extraPay > 0 ? (
            <p>
              {t("loan.advisor.tooltipExtra")}: {formatInr(row.extraPay)}
            </p>
          ) : null}
          {row.totalPay > 0 ? (
            <p className="ct-chart-tooltip-strong">
              {t("loan.advisor.tooltipTotal")}: {formatInr(row.totalPay)}
            </p>
          ) : null}
          {baselinePt ? (
            <p style={{ color: baselinePt.color }}>
              {baselinePt.name}: {formatInr(baselinePt.value)}
            </p>
          ) : null}
          {whatIfPt && whatIfPt.value !== baselinePt?.value ? (
            <p style={{ color: whatIfPt.color }}>
              {whatIfPt.name}: {formatInr(whatIfPt.value)}
            </p>
          ) : null}
        </div>
      );
    };
  }, [showPaymentTooltip, t, baselineKey, whatIfKey]);

  if (!displayData.length) {
    return <Caption className="block opacity-75">{t(emptyKey)}</Caption>;
  }

  return (
    <div className="ct-stack-sm">
      <Body className="ct-body-strong text-sm">{t(titleKey)}</Body>
      {!pathsDiffer && singleSeriesWhenEqual ? (
        <Caption className="block opacity-80">{t("charts.loanNoExtraRoom")}</Caption>
      ) : null}

      <ChartShell hint={t(hintKey)} height={280} compact>
        <FlexibleDataChart
          data={displayData}
          chartType="line"
          theme={theme}
          xKey="name"
          seriesKeys={seriesKeys}
          valueKey={baselineKey}
          valueLabel={t(baselineLabelKey)}
          emptyMessage={t(emptyKey)}
          scoreChart={scoreChart}
          hideDots={displayData.length > 12}
          yDomainTight={yDomainTight}
          customTooltip={paymentTooltip}
          disableTooltipCursor
        />
      </ChartShell>

      {extraCaption}
    </div>
  );
}
