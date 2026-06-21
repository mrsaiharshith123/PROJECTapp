import { useState } from "react";
import { ToolTile } from "../ToolTile.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import PlanToolSheet from "./PlanToolSheet.jsx";
import { renderPlanToolPanel } from "./planToolPanels.jsx";

const CALCULATOR_TOOLS = [
  { id: "tax", icon: "currency-inr", accent: "indigo", titleKey: "plan.tools.tax", subtitleKey: "plan.tools.taxSub" },
  { id: "loan", icon: "chart-line-down", accent: "teal", titleKey: "plan.tools.loanPayoff", subtitleKey: "plan.tools.loanPayoffSub" },
  { id: "safety", icon: "shield", accent: "teal", titleKey: "plan.tools.safety", subtitleKey: "plan.tools.safetySub" },
  { id: "expense", icon: "calculator", accent: "violet", titleKey: "plan.tools.expense", subtitleKey: "plan.tools.expenseSub" },
  { id: "planner", icon: "coins", accent: "amber", titleKey: "plan.tools.planner", subtitleKey: "plan.tools.plannerSub" },
  { id: "loantools", icon: "bank", accent: "indigo", titleKey: "plan.tools.loanTools", subtitleKey: "plan.tools.loanToolsSub" },
  { id: "chit", icon: "users-three", accent: "amber", titleKey: "plan.tools.chit", subtitleKey: "plan.tools.chitSub" },
];

/** Financial calculators — 2-column grid on Plan. */
export default function PlanCalculatorsSection() {
  const { t } = useTranslation();
  const ctx = usePerovo();
  const [activeTool, setActiveTool] = useState(/** @type {string | null} */ (null));

  const activeMeta = CALCULATOR_TOOLS.find((x) => x.id === activeTool);

  const openTool = (id) => {
    setActiveTool(id);
  };

  return (
    <section className="ct-plan-section">
      <h2 className="ct-plan-section-title">{t("plan.section.calculators")}</h2>
      <p className="ct-plan-section-sub">{t("plan.section.calculatorsSub")}</p>

      <div className="ct-plan-grid-2">
        {CALCULATOR_TOOLS.map((tool) => (
          <ToolTile
            key={tool.id}
            icon={tool.icon}
            title={t(tool.titleKey)}
            subtitle={t(tool.subtitleKey)}
            accent={tool.accent}
            onClick={() => openTool(tool.id)}
          />
        ))}
      </div>

      {activeMeta ? (
        <PlanToolSheet
          open
          onClose={() => setActiveTool(null)}
          icon={activeMeta.icon}
          title={t(activeMeta.titleKey)}
          accent={activeMeta.accent}
        >
          {renderPlanToolPanel(activeTool, ctx)}
        </PlanToolSheet>
      ) : null}
    </section>
  );
}
