import { useMemo } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { snapshotsToPressureTrend } from "../../../engines/analyticsSeries.js";
import { buildCashflowForecastSeries, MONEY_OUTLOOK_WINDOW } from "../../../engines/forecastSeries.js";
import { analyzeCreditCardPressure } from "../../../engines/stabilityPlan.js";
import { todayYmd } from "../../../utils/dates.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import {
  buildPaymentsOutlookSeries,
  attachVariableSpendToForecast,
} from "../../../utils/analyticsSpendSeries.js";
import { computeSalaryBreakdown } from "../../../engines/salaryBreakdown.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import {
  getAnalyticsCopy,
  getIncomeLabelKey,
  resolveAnalyticsProfileScope,
} from "../../../constants/modeExperience.js";

/** Shared analytics payload for Insights hub and breakdown sub-pages. */
export function useInsightsData() {
  const { t } = useTranslation();
  const {
    commitments,
    lendings,
    dailySpends,
    settings,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    monthlySnapshots,
    todayStr,
  } = usePerovo();

  const pressureTrend = useMemo(() => snapshotsToPressureTrend(monthlySnapshots, 7), [monthlySnapshots]);

  const paymentsData = useMemo(
    () => buildPaymentsOutlookSeries(commitments, dailySpends, MONEY_OUTLOOK_WINDOW),
    [commitments, dailySpends],
  );

  const analyticsCopy = getAnalyticsCopy(settings);
  const incomeLabel = t(getIncomeLabelKey(settings));
  const income = combinedMonthlyIncome(settings);
  const profileScope = resolveAnalyticsProfileScope(settings);
  const today = todayStr || todayYmd();

  const paycheckFlow = useMemo(
    () =>
      analyticsCopy.showPaycheckFlow
        ? computeSalaryBreakdown(commitments, income, getEffectiveStatus, {
            dailySpends,
            todayStr: today,
            profileId: profileScope,
          })
        : null,
    [
      analyticsCopy.showPaycheckFlow,
      commitments,
      dailySpends,
      income,
      getEffectiveStatus,
      today,
      profileScope,
    ],
  );

  const cardPressureAnalytics = useMemo(
    () => (analyticsCopy.showPaycheckFlow ? analyzeCreditCardPressure(commitments, getEffectiveStatus, income) : null),
    [analyticsCopy.showPaycheckFlow, commitments, getEffectiveStatus, income],
  );

  const forecastSeries = useMemo(() => {
    const rows = buildCashflowForecastSeries(
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
    return attachVariableSpendToForecast(rows, dailySpends);
  }, [commitments, income, getEffectiveStatus, today, lendings, getEffectiveLendingStatus, dailySpends]);

  return {
    forecastSeries,
    paymentsData,
    pressureTrend,
    dailySpends,
    commitments,
    paycheckFlow,
    incomeLabel,
    incomeEntryBasis: settings.incomeEntryBasis === "gross" ? "gross" : "take_home",
    payerSplitForPaycheck: null,
    cardPressureAnalytics,
  };
}
