import { useState } from "react";
import { ToolTile } from "../ToolTile.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import PlanToolSheet from "./PlanToolSheet.jsx";
import { renderPlanToolPanel } from "./planToolPanels.jsx";
import MathCalculatorModal from "../modals/MathCalculatorModal.jsx";

const CALCULATOR_TOOLS = [
  { id: "tax", icon: "currency-inr", accent: "instrument", titleKey: "plan.tools.tax", subtitleKey: "plan.tools.taxSub" },
  { id: "loan", icon: "chart-line-down", accent: "liability", titleKey: "plan.tools.loanPayoff", subtitleKey: "plan.tools.loanPayoffSub" },
  { id: "safety", icon: "shield", accent: "liability", titleKey: "plan.tools.safety", subtitleKey: "plan.tools.safetySub" },
  { id: "math", icon: "calculator", accent: "instrument", titleKey: "tools.mathCalc.short", subtitleKey: "tools.mathCalc.sub" },
  { id: "expense", icon: "calculator", accent: "instrument", titleKey: "plan.tools.expense", subtitleKey: "plan.tools.expenseSub" },
  { id: "planner", icon: "coins", accent: "goal", titleKey: "plan.tools.planner", subtitleKey: "plan.tools.plannerSub" },
  { id: "loantools", icon: "bank", accent: "liability", titleKey: "plan.tools.loanTools", subtitleKey: "plan.tools.loanToolsSub" },
  { id: "chit", icon: "users-three", accent: "goal", titleKey: "plan.tools.chit", subtitleKey: "plan.tools.chitSub" },
];

/** Financial calculators — 2-column grid on Plan. */
export default function PlanCalculatorsSection({ initialTool = null }) {
  const { t } = useTranslation();
  const ctx = usePerovo();
  const [activeTool, setActiveTool] = useState(() => {
    if (!initialTool || initialTool === "retirement") return null;
    return CALCULATOR_TOOLS.some((x) => x.id === initialTool) ? initialTool : null;
  });
  const [mathOpen, setMathOpen] = useState(initialTool === "math");

  const activeMeta = CALCULATOR_TOOLS.find((x) => x.id === activeTool);

  const openTool = (id) => {
    if (id === "math") {
      setMathOpen(true);
      return;
    }
    setActiveTool(id);
  };

  return (
    <section className="ed-section">
      <h2 className="ed-kicker">{t("plan.section.calculators")}</h2>
      <p className="ed-caption">{t("plan.section.calculatorsSub")}</p>

      <div className="ed-grid-2 ed-tool-grid">
        {CALCULATOR_TOOLS.map((tool) => (
          <ToolTile
            key={tool.id}
            icon={tool.icon}
            title={t(tool.titleKey)}
            subtitle={t(tool.subtitleKey)}
            accent={tool.accent}
            onClick={() => openTool(tool.id)}
            className={`pos-tile ${tool.accent}`}
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

      {mathOpen ? <MathCalculatorModal onClose={() => setMathOpen(false)} /> : null}
    </section>
  );
}
