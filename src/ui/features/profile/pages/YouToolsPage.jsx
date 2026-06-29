import { useSearchParams } from "react-router-dom";
import PlanGoalsSection from "../../plan/PlanGoalsSection.jsx";
import PlanCalculatorsSection from "../../plan/PlanCalculatorsSection.jsx";
import PlanGrowthSection from "../../plan/PlanGrowthSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";
import { useTranslation } from "../../../../i18n/I18nProvider.js";

/** You → Tools — goals, calculators, and growth planners. */
export default function YouToolsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialTool = searchParams.get("tool");

  return (
    <YouSubPageShell titleKey="you.tools.title">
      <div
        className="ed-ins-body"
        style={{ padding: "8px 18px 14px", borderBottom: "1px solid var(--ed-rule)" }}
      >
        {t("you.tools.subtitle")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <PlanGoalsSection />
        <PlanCalculatorsSection initialTool={initialTool} />
        <PlanGrowthSection initialTool={initialTool === "retirement" ? "retirement" : null} />
      </div>
    </YouSubPageShell>
  );
}
