import { useSearchParams } from "react-router-dom";
import PlanGoalsSection from "../../plan/PlanGoalsSection.jsx";
import PlanCalculatorsSection from "../../plan/PlanCalculatorsSection.jsx";
import PlanGrowthSection from "../../plan/PlanGrowthSection.jsx";
import { PageShell } from "../../../index.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";

/** You → Tools — goals, calculators, and growth planners. */
export default function YouToolsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialTool = searchParams.get("tool");

  return (
    <PageShell title={t("you.tools.title")} subtitle={t("you.tools.subtitle")} className="ct-you-tools-page">
      <div className="ct-stack-lg">
        <div className="ct-stat-tile goal mb-1 pos-tile goal">
          <p className="ct-analytics-section-title">{t("you.goals.sectionTitle")}</p>
        </div>
        <PlanGoalsSection />
        <PlanCalculatorsSection initialTool={initialTool} />
        <PlanGrowthSection initialTool={initialTool === "retirement" ? "retirement" : null} />
      </div>
    </PageShell>
  );
}
