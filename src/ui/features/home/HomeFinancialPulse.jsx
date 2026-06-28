import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";

/** Single most important financial narrative — taps through to Insights. */
export default function HomeFinancialPulse() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const stable = useStabilityIntel();
  const { settings } = usePerovo();
  const hasIncome = Number(settings.monthlyIncome || 0) > 0;

  const pulse = useMemo(() => {
    const warn = stable.healthNarrative?.warnings?.[0];
    if (warn?.key) {
      return { type: "warning", text: t(warn.key, warn.params) };
    }
    const strength = stable.healthNarrative?.strengths?.[0];
    if (strength?.key) {
      return { type: "positive", text: t(strength.key, strength.params) };
    }
    if (stable.survival?.months != null) {
      const mo = stable.survival.months.toFixed(1);
      return { type: "neutral", text: t("home.ed.pulseRunway", { months: mo }) };
    }
    if (!hasIncome) {
      return { type: "neutral", text: t("home.ed.pulseSetIncome") };
    }
    return null;
  }, [stable, hasIncome, t]);

  if (!pulse) return null;

  const markColor =
    pulse.type === "warning"
      ? "var(--ed-red)"
      : pulse.type === "positive"
        ? "var(--ed-green)"
        : "var(--ed-ink-faint)";

  const mark = pulse.type === "warning" ? "!" : pulse.type === "positive" ? "+" : "·";

  return (
    <div className="ed-brief">
      <div className="ed-brief-head">{t("home.ed.todayInsight")}</div>
      <button type="button" className="ed-brief-row" onClick={() => navigate("/insights")}>
        <span className="ed-brief-mark" style={{ color: markColor }}>
          {mark}
        </span>
        <span className="ed-brief-text">{pulse.text}</span>
        <span className="ed-brief-link">{t("home.ed.viewAll")}</span>
      </button>
    </div>
  );
}
