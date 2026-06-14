import { useMemo } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { buildFamilyMonthlyReport } from "../../../engines/familyMonthlyReport.js";
import { generateFamilyReportHtml } from "../../../utils/familyReportHtml.js";
import { formatInr } from "../../../constants/symbols.js";
import { Card, Body, Caption, Button, Grid, MetricTile } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

function openReportHtml(html) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default function FamilyMonthlyReportCard() {
  const { t } = useTranslation();
  const { settings, commitments, getEffectiveStatus, todayStr, monthlySnapshots } = useCommitTrack();

  const report = useMemo(
    () =>
      buildFamilyMonthlyReport({
        settings,
        commitments,
        getEffectiveStatus,
        todayStr,
        monthlySnapshots,
      }),
    [settings, commitments, getEffectiveStatus, todayStr, monthlySnapshots],
  );

  const whatsappText = t("family.report.whatsappSummary", {
    month: report.month,
    familyName: report.familyName,
    income: formatInr(report.income),
    freeCash: formatInr(report.freeCash),
    tier: t(`family.report.tier.${report.stabilityTier}`),
    paidCount: report.paidCount,
    total: report.commitmentCount,
  });

  return (
    <Card className="ct-stack">
      <div>
        <Body className="font-semibold">{t("family.report.title")}</Body>
        <Caption className="block">{report.month}</Caption>
      </div>
      <Grid cols={2}>
        <MetricTile label={t("family.report.income")} value={formatInr(report.income)} />
        <MetricTile label={t("family.report.freeCash")} value={formatInr(report.freeCash)} />
        <MetricTile
          label={t("family.report.stability")}
          value={`${report.stabilityScore}/100`}
          caption={t(`family.report.tier.${report.stabilityTier}`)}
        />
        <MetricTile
          label={t("family.report.paidOnTime")}
          value={t("family.report.paidRatio", { paid: report.paidCount, total: report.commitmentCount })}
        />
      </Grid>
      <div className="ct-row-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openReportHtml(generateFamilyReportHtml(report))}
        >
          {t("family.report.viewFull")}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, "_blank")}
        >
          {t("family.report.shareWhatsapp")}
        </Button>
      </div>
    </Card>
  );
}
