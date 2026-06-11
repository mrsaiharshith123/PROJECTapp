import { useMemo } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import {
  buildBillBreakdownChartData,
  buildBillTimelineChartData,
  buildBillPaymentList,
} from "../../../utils/billDetailChartData.js";
import { DetailPaymentCharts } from "../../patterns/DetailPaymentCharts.jsx";

/**
 * @param {{ bill: object, summary: object, allCommitments: object[], perCycleAmount?: number }} props
 */
export function BillDetailCharts({ bill, summary, allCommitments, perCycleAmount = 0 }) {
  const { t } = useTranslation();

  const breakdown = useMemo(() => buildBillBreakdownChartData(summary, t), [summary, t]);
  const timeline = useMemo(
    () => buildBillTimelineChartData(bill, allCommitments),
    [bill, allCommitments],
  );
  const paymentList = useMemo(
    () => buildBillPaymentList(bill, allCommitments),
    [bill, allCommitments],
  );
  const extraRows = useMemo(() => {
    if (!perCycleAmount) return [];
    return [
      {
        name: t("bill.detail.perCycle"),
        value: `₹${perCycleAmount.toLocaleString("en-IN")}`,
      },
    ];
  }, [perCycleAmount, t]);

  return (
    <DetailPaymentCharts
      breakdown={breakdown}
      timeline={timeline}
      paymentList={paymentList}
      extraRows={extraRows}
      titleKey="bill.detail.chartsTitle"
      splitTitleKey="bill.detail.chartSplit"
      timelineTitleKey="bill.detail.chartTimeline"
      emptyKey="bill.detail.chartEmpty"
      totalLabelKey="bill.detail.contractTotal"
      paymentListTitleKey="bill.detail.paymentList"
    />
  );
}
