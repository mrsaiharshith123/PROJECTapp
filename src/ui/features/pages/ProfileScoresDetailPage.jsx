import { Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useProfileScoreGuide } from "../../../hooks/useProfileScoreGuide.js";
import { usePerovoScore } from "../../../hooks/usePerovoScore.js";
import { PEROVO_PILLARS } from "../../../constants/metricTaxonomy.js";
import { translatePressureLabel } from "../../../i18n/engineLabels.js";
import { joinEngineMessages } from "../../../i18n/engineLabels.js";
import { formatInr } from "../../../constants/symbols.js";
import { Card, PageHeader, Body, Caption, InfoTip } from "../../index.js";
import { MetricCard } from "../../patterns/MetricCard.jsx";

function formatDue(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

function chipVariant(tone) {
  if (tone === "ok") return "teal";
  if (tone === "mid") return "amber";
  return "danger";
}

export default function ProfileScoresDetailPage() {
  const { t } = useTranslation();
  const { privacyMode } = useNetWorth();
  const guide = useProfileScoreGuide();
  const perovo = usePerovoScore();
  const lendingTrust = guide.detailScores.find((s) => s.id === "lending-trust");

  return (
    <div className="ct-page ct-stack pb-8">
      <Link to="/profile" className="ct-link text-sm">
        {t("profileHub.scoresBack")}
      </Link>
      <PageHeader
        title={t("perovoScore.title")}
        subtitle={t("perovoScore.detailSubtitle")}
      />

      <div className="ct-hero-card pressure relative">
        <div className="ct-hero-glow" aria-hidden />
        <p className="ct-hero-label">{t("perovoScore.title")}</p>
        <p className="ct-hero-number ct-numeral relative">
          {privacyMode ? "•••" : perovo.score}
          {!privacyMode ? <span className="text-lg font-normal opacity-75">/100</span> : null}
        </p>
        {!privacyMode ? (
          <Caption className="block relative opacity-90">{t(`perovoScore.tier.${perovo.tier.id}`)}</Caption>
        ) : null}
      </div>

      <div className="ct-grid-2 gap-2">
        {PEROVO_PILLARS.map((pillar) => {
          const data = perovo.pillars[pillar.id];
          return (
            <MetricCard
              key={pillar.id}
              label={t(`perovoScore.pillar.${pillar.id}`)}
              value={privacyMode ? "•••" : data?.score ?? 0}
              trend={privacyMode ? null : data?.trend ?? null}
              icon={pillar.icon}
              tone={pillar.tone}
            />
          );
        })}
      </div>

      <div className="ct-stack-sm px-1">
        <Body className="ct-body-strong text-sm">{t("scores.pillars.title")}</Body>
        <Caption className="block">{t("scores.pillars.cashflow")}</Caption>
        <Caption className="block">{t("scores.pillars.savings")}</Caption>
        <Caption className="block">{t("scores.pillars.debt")}</Caption>
        <Caption className="block">{t("scores.pillars.protection")}</Caption>
      </div>

      <Body className="ct-body-strong text-sm">{t("profileHub.scoresDetailTitle")}</Body>

      <Caption className="block">
        {t("profileHub.scoresFreeCash", {
          amount: privacyMode ? "•••" : guide.formatFreeMoney,
        })}
      </Caption>

      {guide.narrative &&
        (guide.narrative.strengths?.length > 0 || guide.narrative.weaknesses?.length > 0) && (
          <Card variant="flat" className="ct-stack-sm">
            {guide.narrative.strengths?.length > 0 && (
              <Caption className="block">
                <span className="ct-text-success font-semibold">{t("pulse.strengths")} </span>
                {joinEngineMessages(t, guide.narrative.strengths)}
              </Caption>
            )}
            {guide.narrative.weaknesses?.length > 0 && (
              <Caption className="block">
                <span className="ct-text-warning font-semibold">{t("pulse.watch")} </span>
                {joinEngineMessages(t, guide.narrative.weaknesses)}
              </Caption>
            )}
          </Card>
        )}

      {guide.focusFirst && (
        <div className="ct-hero-card survival relative ct-stack-sm">
          <div className="ct-hero-glow amber" aria-hidden />
          <Body className="ct-body-strong relative">{t("profileHub.scoreFix.payFirst")}</Body>
          <Caption className="block font-semibold relative">{guide.focusFirst.name}</Caption>
          <Caption className="block opacity-80 relative">
            {guide.focusFirst.message || t("profileHub.scoreFix.payFirstHint")}
          </Caption>
        </div>
      )}

      <div className="ct-stack">
        {guide.detailScores.map((score) => (
          <Card key={score.id} variant="flat" className="ct-stack-sm">
            <div className="ct-row-between gap-2 flex-wrap items-start">
              <Body className="ct-body-strong inline-flex items-center gap-1">
                {t(score.titleKey)}
                {score.helpKey ? <InfoTip text={t(score.helpKey)} /> : null}
              </Body>
              {score.id === "pressure" && !score.emptyKey ? (
                <div className={`ct-stat-tile ${chipVariant(score.tone === "success" ? "ok" : score.tone === "warning" ? "mid" : "risk")} shrink-0 text-right min-w-[7rem]`}>
                  <p className="ct-stat-label">{t("pulse.pressureHint")}</p>
                  <p className="ct-stat-value">
                    {score.statusLabel ? translatePressureLabel(t, score.statusLabel) : score.value}
                  </p>
                  <p className="ct-stat-label mt-0.5 ct-numeral">{score.value}</p>
                </div>
              ) : score.id === "health" && score.statusKey && !score.emptyKey ? (
                <div className={`ct-stat-tile ${chipVariant(guide.primary.health.tone)} shrink-0 text-right min-w-[7rem]`}>
                  <p className="ct-stat-label">{t("scores.health.hint")}</p>
                  <p className="ct-stat-value">{t(score.statusKey)}</p>
                  <p className="ct-stat-label mt-0.5 ct-numeral">{score.value}</p>
                </div>
              ) : (
                <div className="ct-stat-tile indigo shrink-0 text-right min-w-[7rem]">
                  <p className="ct-stat-value ct-numeral">
                    {score.emptyKey ? t(score.emptyKey) : score.value}
                  </p>
                </div>
              )}
            </div>
            {score.id !== "pressure" && score.id !== "health" && (score.statusKey || score.statusLabel) && (
              <Caption className="block">
                {score.statusKey ? t(score.statusKey) : translatePressureLabel(t, score.statusLabel)}
              </Caption>
            )}
            {score.extraLine && (
              <Caption className="block">
                {t(score.extraLine.key, score.extraLine.params ?? undefined)}
              </Caption>
            )}
            {score.subScores?.length > 0 && (
              <div className="ct-grid-2 gap-2">
                {score.subScores.map((sub) => (
                  <div key={sub.labelKey} className="ct-stat-tile">
                    <p className="ct-stat-label">{t(sub.labelKey)}</p>
                    <p className="ct-stat-value ct-numeral">{sub.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="ct-stack-sm mt-1 pt-2 border-t border-white/5">
              <Caption className="block font-semibold">{t("profileHub.scoreDetail.why")}</Caption>
              <ul className="list-disc pl-4 space-y-1">
                {score.whyKeys.map((key) => (
                  <li key={key}>
                    <Caption className="block">{t(key)}</Caption>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ct-stack-sm">
              <Caption className="block font-semibold">{t("profileHub.scoreDetail.fix")}</Caption>
              <ul className="list-disc pl-4 space-y-1">
                {score.fixKeys.map((key) => (
                  <li key={key}>
                    <Caption className="block">{t(key)}</Caption>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {guide.payoffOrder.length > 0 && (
        <Card className="ct-stack-sm">
          <Body className="ct-body-strong">{t("profileHub.scorePayOrder")}</Body>
          <Caption className="block mb-2">{t("profileHub.scorePayOrderHint")}</Caption>
          <ol className="space-y-2">
            {guide.payoffOrder.map((row, i) => (
              <li key={`${row.name}-${i}`} className="ct-row-between gap-2 text-sm">
                <span>
                  <span className="font-semibold">{i + 1}.</span> {row.name}
                  {row.dueDate ? (
                    <Caption className="inline ml-1 opacity-75">
                      ({formatDue(row.dueDate)})
                    </Caption>
                  ) : null}
                </span>
                <span className="ct-numeral shrink-0">{formatInr(row.amount || 0)}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Caption className="block text-center opacity-75">
        {t("help.healthScore")}
      </Caption>
    </div>
  );
}
