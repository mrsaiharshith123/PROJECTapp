import { useMemo } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { buildLendingDashboard } from "../../../utils/lendingFinancials.js";
import {
  buildLendingBreakdownChartData,
  buildLendingTimelineChartData,
  buildLendingPaymentList,
  buildLendingChartExtraRows,
} from "../../../utils/lendingDetailChartData.js";
import { DetailPaymentCharts } from "../../patterns/DetailPaymentCharts.jsx";

/** @param {{ lending: object }} props */
export function LendingDetailCharts({ lending }) {
  const { t } = useTranslation();
  const dash = useMemo(() => buildLendingDashboard(lending, {}), [lending]);

  const breakdown = useMemo(
    () => buildLendingBreakdownChartData(lending, dash, t),
    [lending, dash, t],
  );
  const timeline = useMemo(() => buildLendingTimelineChartData(lending), [lending]);
  const paymentList = useMemo(() => buildLendingPaymentList(lending), [lending]);
  const extraRows = useMemo(() => buildLendingChartExtraRows(lending, t), [lending, t]);

  return (
    <DetailPaymentCharts
      breakdown={breakdown}
      timeline={timeline}
      paymentList={paymentList}
      extraRows={extraRows}
      titleKey="lending.detail.chartsTitle"
      splitTitleKey="lending.detail.chartSplit"
      timelineTitleKey="lending.detail.chartTimeline"
      emptyKey="lending.detail.chartEmpty"
      totalLabelKey="lending.detail.totalPayable"
      paymentListTitleKey="lending.detail.paymentHistory"
    />
  );
}
