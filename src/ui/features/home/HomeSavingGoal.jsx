import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";

/** Nearest active goal — brief row with progress bar. */
export default function HomeSavingGoal() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { goals } = usePerovo();

  const nearest = useMemo(() => {
    if (!goals || goals.length === 0) return null;
    const active = goals.filter((g) => {
      const pct =
        g.savedAmount > 0 && g.targetAmount > 0
          ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100))
          : 0;
      return pct < 100;
    });
    if (!active.length) return null;
    return active.sort((a, b) => {
      const da = a.targetDate || a.deadline || "9999-12-31";
      const db = b.targetDate || b.deadline || "9999-12-31";
      return da.localeCompare(db);
    })[0];
  }, [goals]);

  if (!nearest) return null;

  const pct =
    nearest.targetAmount > 0
      ? Math.min(100, Math.round(((nearest.savedAmount ?? 0) / nearest.targetAmount) * 100))
      : 0;

  const goalTitle = nearest.title || nearest.name || t("home.ed.goal");

  return (
    <div className="ed-brief">
      <div className="ed-brief-head">{t("home.ed.yourGoal")}</div>
      <button type="button" className="ed-brief-row" onClick={() => navigate("/you/tools")}>
        <span className="ed-brief-mark ed-brief-mark-goal">◎</span>
        <span className="ed-brief-text ed-goal-brief">
          <span>
            {goalTitle} — {t("home.ed.goalFunded", { pct })}
          </span>
          <span className="ed-goal-bar">
            <span className="ed-goal-bar-fill" style={{ width: `${pct}%` }} />
          </span>
        </span>
        <span className="ed-brief-link">{t("home.ed.viewGoals")}</span>
      </button>
    </div>
  );
}
