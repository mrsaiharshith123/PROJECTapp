import { useMemo } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { snapshotsToPressureTrend } from "../../../engines/analyticsSeries.js";
import { buildCashflowForecastSeries, MONEY_OUTLOOK_WINDOW } from "../../../engines/forecastSeries.js";
import { analyzeCreditCardPressure } from "../../../engines/stabilityPlan.js";
import { todayYmd } from "../../../utils/dates.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { buildPaymentsOutlookSeries } from "../../../utils/monthPaymentSummary.js";
import { computeSalaryBreakdown } from "../../../engines/salaryBreakdown.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import {
  getAnalyticsCopy,
  getIncomeLabelKey,
} from "../../../constants/modeExperience.js";

/** Shared analytics payload for Insights hub and breakdown sub-pages. */
export function useInsightsData() {
  const { t } = useTranslation();
  const {
    commitments,
    lendings,
    settings,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    monthlySnapshots,
    todayStr,
  } = usePerovo();

  const pressureTrend = useMemo(() => snapshotsToPressureTrend(monthlySnapshots, 7), [monthlySnapshots]);

  const paymentsData = useMemo(
    () => buildPaymentsOutlookSeries(commitments, MONEY_OUTLOOK_WINDOW),
    [commitments],
  );

  const analyticsCopy = getAnalyticsCopy(settings);
  const incomeLabel = t(getIncomeLabelKey(settings));
  const income = combinedMonthlyIncome(settings);
  const today = todayStr || todayYmd();

  const paycheckFlow = useMemo(
    () =>
      analyticsCopy.showPaycheckFlow
        ? computeSalaryBreakdown(commitments, income, getEffectiveStatus)
        : null,
    [analyticsCopy.showPaycheckFlow, commitments, income, getEffectiveStatus],
  );

  const cardPressureAnalytics = useMemo(
    () => (analyticsCopy.showPaycheckFlow ? analyzeCreditCardPressure(commitments, getEffectiveStatus, income) : null),
    [analyticsCopy.showPaycheckFlow, commitments, getEffectiveStatus, income],
  );

  const forecastSeries = useMemo(() => {
    return buildCashflowForecastSeries(
      commitments,
      income,
      getEffectiveStatus,
      today,
      MONEY_OUTLOOK_WINDOW.months,
      {
        startOffset: MONEY_OUTLOOK_WINDOW.startOffset,
        lendings,
        getEffectiveLendingStatus,
      },
    );
  }, [commitments, income, getEffectiveStatus, today, lendings, getEffectiveLendingStatus]);

  return {
    forecastSeries,
    paymentsData,
    pressureTrend,
    commitments,
    paycheckFlow,
    incomeLabel,
    incomeEntryBasis: settings.incomeEntryBasis === "gross" ? "gross" : "take_home",
    payerSplitForPaycheck: null,
    cardPressureAnalytics,
  };
}
