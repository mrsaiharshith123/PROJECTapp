import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";

/** Optional positive insight — hides when nothing genuine to celebrate. */
export default function HomeGoodNewsLine() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const stable = useStabilityIntel();
  const { monthlySnapshots } = usePerovo();

  const scoreImprovement = useMemo(() => {
    const snaps = [...(monthlySnapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
    if (snaps.length < 2) return null;
    const prev = snaps[snaps.length - 2].pressureScore;
    const curr = snaps[snaps.length - 1].pressureScore;
    if (prev == null || curr == null) return null;
    const delta = prev - curr;
    return delta >= 10 ? Math.round(delta) : null;
  }, [monthlySnapshots]);

  const message = useMemo(() => {
    if (scoreImprovement != null) {
      return t("home.goodNews.shareScore", { pts: scoreImprovement });
    }
    const growth = stable.lifestyle?.growthPercent;
    if (growth != null && growth <= -8) {
      return t("home.goodNews.spendDown", { percent: Math.abs(Math.round(growth)) });
    }
    const strength = stable.healthNarrative?.strengths?.[0];
    if (strength?.key) {
      return t(strength.key, strength.params);
    }
    return null;
  }, [scoreImprovement, stable.lifestyle?.growthPercent, stable.healthNarrative?.strengths, t]);

  if (!message) return null;

  const isShare = scoreImprovement != null;

  return (
    <button
      type="button"
      className="ct-home-good-news ct-stat-tile teal ct-home-enter-item ct-pressable"
      style={{ animationDelay: "180ms" }}
      onClick={isShare ? () => navigate("/profile/scores") : undefined}
      disabled={!isShare}
    >
      <span className="ct-good-news-dot" aria-hidden />
      <span>{message}</span>
    </button>
  );
}
