import { Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useProfileScoreGuide } from "../../../hooks/useProfileScoreGuide.js";
import { translatePressureLabel } from "../../../i18n/engineLabels.js";
import { joinEngineMessages } from "../../../i18n/engineLabels.js";
import { formatInr } from "../../../constants/symbols.js";
import { Card, PageHeader, Body, Caption, InfoTip, Badge } from "../../index.js";

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

export default function ProfileScoresDetailPage() {
  const { t } = useTranslation();
  const { privacyMode } = useNetWorth();
  const guide = useProfileScoreGuide();
  const lendingTrust = guide.detailScores.find((s) => s.id === "lending-trust");

  return (
    <div className="ct-page ct-stack pb-8">
      <Link to="/profile" className="ct-link text-sm">
        {t("profileHub.scoresBack")}
      </Link>
      <PageHeader
        title={t("profileHub.scoresDetailTitle")}
        subtitle={t("profileHub.scoresDetailSubtitle")}
      />

      <div className="ct-profile-hero-chips ct-profile-hero-chips-status ct-profile-hero-chips-4">
        {guide.heroChips.map((chip) => (
          <div key={chip.id} className={`ct-profile-chip ct-profile-chip-${chip.tone}`}>
            <Caption className="block ct-profile-chip-label">{t(chip.labelKey)}</Caption>
            <span className="ct-profile-chip-value">{privacyMode ? "•••" : chip.value}</span>
          </div>
        ))}
        {lendingTrust ? (
          <div className="ct-profile-chip ct-profile-chip-ok">
            <Caption className="block ct-profile-chip-label">{t(lendingTrust.titleKey)}</Caption>
            <span className="ct-profile-chip-value">
              {privacyMode
                ? "•••"
                : lendingTrust.emptyKey
                  ? t(lendingTrust.emptyKey)
                  : lendingTrust.value}
            </span>
          </div>
        ) : null}
      </div>

      <Caption className="block">
        {t("profileHub.scoresFreeCash", { amount: guide.formatFreeMoney })}
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
        <Card className="ct-insight-accent ct-stack-sm">
          <Body className="ct-body-strong">{t("profileHub.scoreFix.payFirst")}</Body>
          <Caption className="block font-semibold">{guide.focusFirst.name}</Caption>
          <Caption className="block opacity-80">
            {guide.focusFirst.message || t("profileHub.scoreFix.payFirstHint")}
          </Caption>
        </Card>
      )}

      <div className="ct-stack">
        {guide.detailScores.map((score) => (
          <Card key={score.id} variant="flat" className="ct-stack-sm">
            <div className="ct-row-between gap-2 flex-wrap">
              <Body className="ct-body-strong inline-flex items-center gap-1">
                {t(score.titleKey)}
                {score.helpKey ? <InfoTip text={t(score.helpKey)} /> : null}
              </Body>
              <Badge tone="neutral">
                {score.emptyKey ? t(score.emptyKey) : score.value}
              </Badge>
            </div>
            {(score.statusKey || score.statusLabel) && (
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
              <div className="ct-row gap-3 flex-wrap">
                {score.subScores.map((sub) => (
                  <Caption key={sub.labelKey} className="block">
                    {t(sub.labelKey)}: <span className="font-semibold">{sub.value}</span>
                  </Caption>
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
