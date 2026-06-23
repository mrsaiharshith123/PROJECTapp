import { useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useProfileScoreGuide } from "../../../hooks/useProfileScoreGuide.js";
import { usePerovoScore } from "../../../hooks/usePerovoScore.js";
import { translatePressureLabel } from "../../../i18n/engineLabels.js";
import { joinEngineMessages } from "../../../i18n/engineLabels.js";
import { Body, Caption, CtIcon } from "../../index.js";
import YouSubPageShell from "../profile/pages/YouSubPageShell.jsx";

function chipVariant(tone) {
  if (tone === "ok") return "teal";
  if (tone === "mid") return "amber";
  return "danger";
}

function chipColor(tone) {
  if (tone === "ok") return "#2dd4bf";
  if (tone === "mid") return "#fbbf24";
  return "#f87171";
}

function toneColor(tone) {
  if (tone === "success" || tone === "ok") return "#2dd4bf";
  if (tone === "warning" || tone === "mid") return "#fbbf24";
  return "#f87171";
}

export default function ProfileScoresDetailPage() {
  const { t } = useTranslation();
  const { privacyMode } = useNetWorth();
  const guide = useProfileScoreGuide();
  const perovo = usePerovoScore();
  const [openId, setOpenId] = useState(null);

  return (
    <YouSubPageShell titleKey="perovoScore.title">
      <div className="ct-grid-2 gap-2">
        {guide.heroChips.map((chip) => (
          <div key={chip.id} className={`ct-stat-tile ${chipVariant(chip.tone)} text-center py-3 px-2`}>
            <p className="ct-stat-label">{t(chip.labelKey)}</p>
            <p
              className="ct-stat-value ct-numeral mt-1"
              style={{ color: chipColor(chip.tone) }}
            >
              {privacyMode
                ? "•••"
                : chip.id === "pressure"
                  ? `${chip.detailValue ?? 0}`
                  : chip.value}
            </p>
          </div>
        ))}
        <div className={`ct-stat-tile ${chipVariant(perovo.tier?.tone === "success" ? "ok" : perovo.tier?.tone === "warning" ? "mid" : "risk")} text-center py-3 px-2`}>
          <p className="ct-stat-label">{t("perovoScore.title")}</p>
          <p className="ct-stat-value ct-numeral mt-1">{privacyMode ? "•••" : `${perovo.score}`}</p>
        </div>
      </div>

      <div className="ct-stat-tile mt-3">
        <p className="ct-stat-label">{t("profileHub.scoresFreeCashLabel")}</p>
        <p className="ct-stat-value" style={{ color: "#fcd34d" }}>
          {privacyMode ? "••••" : guide.formatFreeMoney}
        </p>
      </div>

      {guide.narrative &&
        (guide.narrative.strengths?.length > 0 || guide.narrative.weaknesses?.length > 0) && (
          <div className="ct-analytics-card mt-3 ct-stack-sm">
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
          </div>
        )}

      {guide.focusFirst ? (
        <div className="ct-hero-card survival relative ct-stack-sm mt-3">
          <div className="ct-hero-glow amber" aria-hidden />
          <Body className="ct-body-strong relative">{t("profileHub.scoreFix.payFirst")}</Body>
          <Caption className="block font-semibold relative">{guide.focusFirst.name}</Caption>
          <Caption className="block opacity-80 relative">
            {guide.focusFirst.message || t("profileHub.scoreFix.payFirstHint")}
          </Caption>
        </div>
      ) : null}

      <div className="mt-4 ct-stack-sm">
        {guide.detailScores.map((score) => (
          <div key={score.id} className="ct-score-accordion">
            <button
              type="button"
              className="ct-score-accordion-head"
              onClick={() => setOpenId(openId === score.id ? null : score.id)}
            >
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-medium text-[var(--ct-text)]">{t(score.titleKey)}</p>
                {(score.statusKey || score.statusLabel) && (
                  <p className="text-[11px] mt-0.5" style={{ color: toneColor(score.tone) }}>
                    {score.statusKey ? t(score.statusKey) : translatePressureLabel(t, score.statusLabel)}
                  </p>
                )}
              </div>
              <p className="ct-numeral text-lg font-semibold shrink-0" style={{ color: toneColor(score.tone) }}>
                {score.emptyKey ? t(score.emptyKey) : score.value}
              </p>
              <CtIcon
                name={openId === score.id ? "caret-up" : "caret-down"}
                size={14}
                className="text-[var(--ct-text-muted)] shrink-0"
              />
            </button>

            {openId === score.id ? (
              <div className="ct-score-accordion-body">
                <p className="ct-score-accordion-kicker">{t("profileHub.scoreDetail.why")}</p>
                {score.whyKeys.map((key) => (
                  <p key={key} className="ct-score-accordion-line">
                    {t(key)}
                  </p>
                ))}
                <p className="ct-score-accordion-kicker mt-2">{t("profileHub.scoreDetail.fix")}</p>
                {score.fixKeys.map((key) => (
                  <p key={key} className="ct-score-accordion-line ct-score-accordion-line-fix">
                    {t(key)}
                  </p>
                ))}
                {score.subScores?.length > 0 ? (
                  <div className="ct-row gap-2 flex-wrap mt-2">
                    {score.subScores.map((sub) => (
                      <span key={sub.labelKey} className="ct-score-sub-chip">
                        {t(sub.labelKey)}: <strong>{sub.value}</strong>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>

    </YouSubPageShell>
  );
}
