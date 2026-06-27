import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";

import { CtIcon } from "../../icons/CtIcon.jsx";

/** Optional positive insight — editorial "In Brief" line. */
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

  const rowContent = (
    <>
      <span className="ed-brief-mark positive">+</span>
      <span className="ed-brief-text">{message}</span>
      {isShare ? (
        <span
          style={{
            fontSize: 10,
            color: "var(--ed-gold)",
            fontWeight: 600,
            fontFamily: "var(--ct-font)",
            flexShrink: 0,
          }}
        >
          {t("home.goodNews.shareLink")}
        </span>
      ) : null}
    </>
  );

  return (
    <div className="ed-brief">
      <div className="ed-brief-head">{t("home.ed.briefHead")}</div>
      {isShare ? (
        <button type="button" className="ed-brief-row" onClick={() => navigate("/insights/score")}>
          {rowContent}
          <CtIcon name="caret-right" size={14} className="ed-brief-chevron" />
        </button>
      ) : (
        <div className="ed-brief-row">
          {rowContent}
          <CtIcon name="caret-right" size={14} className="ed-brief-chevron" />
        </div>
      )}
    </div>
  );
}
