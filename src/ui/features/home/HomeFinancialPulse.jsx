import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { translateInsight } from "../../../i18n/insightLabels.js";

/** Today's insight — renders first on Home using fast commit intel (no heavy stability pass). */
export default function HomeFinancialPulse() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { insights, stability } = useCommitIntel();
  const { settings } = usePerovo();
  const hasIncome = Number(settings.monthlyIncome || 0) > 0;

  const pulse = useMemo(() => {
    const pick = (tones) => insights.find((ins) => tones.includes(ins.tone));
    const urgent = pick(["critical", "warning"]);
    if (urgent) {
      return { type: "warning", text: translateInsight(t, urgent) };
    }
    const positive = pick(["positive"]);
    if (positive) {
      return { type: "positive", text: translateInsight(t, positive) };
    }
    if (insights[0]) {
      return { type: "neutral", text: translateInsight(t, insights[0]) };
    }
    if (stability?.label) {
      return { type: "neutral", text: stability.label };
    }
    if (!hasIncome) {
      return { type: "neutral", text: t("home.ed.pulseSetIncome") };
    }
    return null;
  }, [insights, stability, hasIncome, t]);

  if (!pulse) return null;

  const markColor =
    pulse.type === "warning"
      ? "var(--ed-red)"
      : pulse.type === "positive"
        ? "var(--ed-green)"
        : "var(--ed-ink-faint)";

  const mark = pulse.type === "warning" ? "!" : pulse.type === "positive" ? "+" : "·";

  return (
    <section className="ed-ins-story ed-home-insight">
      <div className="ed-ins-kicker">{t("home.ed.todayInsight")}</div>
      <button type="button" className="ed-profile-sheet-row ed-profile-sheet-row--home" onClick={() => navigate("/insights")}>
        <span className="ed-brief-mark" style={{ color: markColor }}>
          {mark}
        </span>
        <span className="ed-profile-sheet-row-label">{pulse.text}</span>
        <span className="ed-brief-link">{t("home.ed.viewAll")}</span>
      </button>
    </section>
  );
}
