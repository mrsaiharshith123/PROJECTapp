import { useMemo } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { buildFamilyMonthlyReport } from "../../../engines/familyMonthlyReport.js";
import { generateFamilyReportHtml } from "../../../utils/familyReportHtml.js";
import { formatInr } from "../../../constants/symbols.js";
import { Card, Body, Caption, Button } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

function openReportHtml(html) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default function FamilyMonthlyReportCard() {
  const { t } = useTranslation();
  const { settings, commitments, getEffectiveStatus, todayStr, monthlySnapshots } = usePerovo();

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

  const tiles = [
    { label: t("family.report.income"), value: formatInr(report.income), tone: "indigo" },
    { label: t("family.report.freeCash"), value: formatInr(report.freeCash), tone: "teal" },
    {
      label: t("family.report.stability"),
      value: `${report.stabilityScore}/100`,
      caption: t(`family.report.tier.${report.stabilityTier}`),
      tone: "amber",
    },
    {
      label: t("family.report.paidOnTime"),
      value: t("family.report.paidRatio", { paid: report.paidCount, total: report.commitmentCount }),
      tone: "indigo",
    },
  ];

  return (
    <Card className="ct-stack">
      <div>
        <Body className="font-semibold">{t("family.report.title")}</Body>
        <Caption className="block">{report.month}</Caption>
      </div>
      <div className="ct-grid-2">
        {tiles.map((tile) => (
          <div key={tile.label} className={`ct-stat-tile ${tile.tone}`}>
            <p className="ct-stat-tile-value ct-numeral">{tile.value}</p>
            <p className="ct-stat-tile-label">{tile.label}</p>
            {tile.caption ? <Caption className="block mt-0.5">{tile.caption}</Caption> : null}
          </div>
        ))}
      </div>
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
