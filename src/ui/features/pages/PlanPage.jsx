import { PageShell } from "../../index.js";
import PlanGoalsSection from "../plan/PlanGoalsSection.jsx";
import PlanCalculatorsSection from "../plan/PlanCalculatorsSection.jsx";
import PlanGrowthSection from "../plan/PlanGrowthSection.jsx";
import PlanAISection from "../plan/PlanAISection.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** Plan tab — goals, calculators, growth tools, AI advisor. */
export default function PlanPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t("nav.plan")} className="ct-plan-page">
      <div className="ct-plan-sections">
        <div className="ct-animate-fade-up" style={{ animationDelay: "0ms" }}>
          <PlanGoalsSection />
        </div>
        <div className="ct-animate-fade-up" style={{ animationDelay: "80ms" }}>
          <PlanCalculatorsSection />
        </div>
        <div className="ct-animate-fade-up" style={{ animationDelay: "160ms" }}>
          <PlanGrowthSection />
        </div>
        <div className="ct-animate-fade-up" style={{ animationDelay: "240ms" }}>
          <PlanAISection />
        </div>
      </div>
    </PageShell>
  );
}
