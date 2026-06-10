import { Card, Heading, Caption, Body } from "../../index.js";
import { benchmarkNetWorth } from "../../../engines/netWorthBenchmark.js";
import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/**
 * @param {{ netWorth: number, monthlyIncome: number, age?: number }} props
 */
export default function NetWorthBenchmarkCard({ netWorth, monthlyIncome, age = 30 }) {
  const { t } = useTranslation();
  const bench = benchmarkNetWorth({ netWorth, monthlyIncome, age });
  if (!bench.peerMedian) return null;

  return (
    <Card className="ct-stack-sm">
      <Heading level={3}>{t("netWorth.benchmark.title")}</Heading>
      <Caption className="block">{t(bench.ageBandKey)}</Caption>
      <div className="ct-grid-2">
        <div>
          <Caption>{t("netWorth.benchmark.yours")}</Caption>
          <Body className="font-semibold ct-numeral">{formatInr(bench.netWorth)}</Body>
        </div>
        <div>
          <Caption>{t("netWorth.benchmark.peerMedian")}</Caption>
          <Body className="font-semibold ct-numeral">{formatInr(bench.peerMedian)}</Body>
        </div>
      </div>
      {bench.estimatedPercentile != null && (
        <Caption className="block">{t("netWorth.benchmark.percentile", { pct: bench.estimatedPercentile })}</Caption>
      )}
      <Caption className="block opacity-80">{t(`insight.${bench.insightId}`)}</Caption>
    </Card>
  );
}
