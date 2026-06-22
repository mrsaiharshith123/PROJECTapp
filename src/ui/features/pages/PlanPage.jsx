import { useNavigate } from "react-router-dom";
import { PageShell } from "../../index.js";
import PlanGoalsSection from "../plan/PlanGoalsSection.jsx";
import PlanCalculatorsSection from "../plan/PlanCalculatorsSection.jsx";
import PlanGrowthSection from "../plan/PlanGrowthSection.jsx";
import PlanAISection from "../plan/PlanAISection.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** Plan tab — goals, calculators, growth tools, AI advisor. */
export default function PlanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <PageShell title={t("nav.plan")} subtitle={t("plan.subtitle")} className="ct-plan-page">
      <div className="ct-plan-sections ct-stack">
        <section className="ct-animate-fade-up" style={{ animationDelay: "0ms" }}>
          <div className="ct-stat-tile indigo mb-2">
            <p className="ct-analytics-section-title">{t("plan.goals.heroLabel")}</p>
          </div>
          <PlanGoalsSection />
        </section>

        <section className="ct-animate-fade-up ct-stack-sm" style={{ animationDelay: "40ms" }}>
          <button
            type="button"
            className="ct-settings-row ct-pressable"
            onClick={() => navigate("/money/insights")}
          >
            <span className="ct-settings-row-label">{t("plan.link.insights")}</span>
            <span className="ct-settings-row-caret" aria-hidden>
              →
            </span>
          </button>
          <button
            type="button"
            className="ct-settings-row ct-pressable"
            onClick={() => navigate("/money/wealth")}
          >
            <span className="ct-settings-row-label">{t("plan.link.wealth")}</span>
            <span className="ct-settings-row-caret" aria-hidden>
              →
            </span>
          </button>
        </section>
        <section className="ct-animate-fade-up" style={{ animationDelay: "80ms" }}>
          <div className="ct-stat-tile indigo mb-2">
            <p className="ct-analytics-section-title">{t("plan.section.calculators")}</p>
            <p className="ct-analytics-section-sub">{t("plan.section.calculatorsSub")}</p>
          </div>
          <PlanCalculatorsSection />
        </section>
        <section className="ct-animate-fade-up" style={{ animationDelay: "160ms" }}>
          <div className="ct-stat-tile teal mb-2">
            <p className="ct-analytics-section-title">{t("plan.section.growth")}</p>
            <p className="ct-analytics-section-sub">{t("plan.section.growthSub")}</p>
          </div>
          <PlanGrowthSection />
        </section>
        <section className="ct-animate-fade-up" style={{ animationDelay: "240ms" }}>
          <div className="ct-stat-tile indigo mb-2">
            <p className="ct-analytics-section-title">{t("plan.section.ai")}</p>
            <p className="ct-analytics-section-sub">{t("plan.subtitle")}</p>
          </div>
          <PlanAISection />
        </section>
      </div>
    </PageShell>
  );
}
