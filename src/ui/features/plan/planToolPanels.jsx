import IncomeTaxPanel from "../tools/IncomeTaxPanel.jsx";
import LoanPayoffAdvisor from "../tools/LoanPayoffAdvisor.jsx";
import SafetyPlannerPanel from "../tools/SafetyPlannerPanel.jsx";
import ExpenseSimulatorForm from "../tools/ExpenseSimulatorForm.jsx";
import MoneyPlannerPanel from "../tools/MoneyPlannerPanel.jsx";
import LoanToolsPanel from "../tools/LoanToolsPanel.jsx";
import ChitFundAdvisor from "../tools/ChitFundAdvisor.jsx";
import InvestSavingsPanel from "../tools/InvestSavingsPanel.jsx";
import RetirementPlannerPanel from "../tools/RetirementPlannerPanel.jsx";
import BondAdvisor from "../tools/BondAdvisor.jsx";
import UnifiedScenariosPanel from "../tools/UnifiedScenariosPanel.jsx";
import PlanWealthSimulationPanel from "./PlanWealthSimulationPanel.jsx";
import GoalsToolPanel from "../tools/GoalsToolPanel.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";

/** Wrap plan tool panel content with modern sheet surface. */
function PlanToolPanelShell({ children }) {
  if (!children) return null;
  return <div className="ct-plan-tool-panel ct-stat-tile !p-0 !bg-transparent !border-0">{children}</div>;
}

/**
 * Render a Plan tool panel by id.
 * @param {string} toolId
 * @param {object} ctx Perovo context slice
 */
export function renderPlanToolPanel(toolId, ctx) {
  const {
    commitments,
    lendings,
    settings,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    todayStr,
    goalDraft,
  } = ctx;
  const income = combinedMonthlyIncome(settings);

  switch (toolId) {
    case "tax":
      return <PlanToolPanelShell><IncomeTaxPanel /></PlanToolPanelShell>;
    case "loan":
      return (
        <PlanToolPanelShell>
          <LoanPayoffAdvisor
            commitments={commitments}
            lendings={lendings}
            settings={settings}
            getEffectiveStatus={getEffectiveStatus}
            getEffectiveLendingStatus={getEffectiveLendingStatus}
            todayStr={todayStr}
          />
        </PlanToolPanelShell>
      );
    case "safety":
      return <PlanToolPanelShell><SafetyPlannerPanel /></PlanToolPanelShell>;
    case "expense":
      return <PlanToolPanelShell><ExpenseSimulatorForm /></PlanToolPanelShell>;
    case "planner":
      return <PlanToolPanelShell><MoneyPlannerPanel /></PlanToolPanelShell>;
    case "loantools":
      return <PlanToolPanelShell><LoanToolsPanel /></PlanToolPanelShell>;
    case "chit":
      return (
        <PlanToolPanelShell>
          <ChitFundAdvisor
            commitments={commitments}
            settings={settings}
            getEffectiveStatus={getEffectiveStatus}
            todayStr={todayStr}
          />
        </PlanToolPanelShell>
      );
    case "invest":
      return <PlanToolPanelShell><InvestSavingsPanel /></PlanToolPanelShell>;
    case "retirement":
      return <PlanToolPanelShell><RetirementPlannerPanel /></PlanToolPanelShell>;
    case "bond":
      return <PlanToolPanelShell><BondAdvisor monthlyIncome={income} /></PlanToolPanelShell>;
    case "wealth":
      return <PlanToolPanelShell><PlanWealthSimulationPanel /></PlanToolPanelShell>;
    case "scenarios":
      return <PlanToolPanelShell><UnifiedScenariosPanel /></PlanToolPanelShell>;
    case "goals":
      return (
        <PlanToolPanelShell>
          <GoalsToolPanel
            initialTitle={goalDraft?.title || ""}
            initialType={goalDraft?.type || "save_amount"}
          />
        </PlanToolPanelShell>
      );
    default:
      return null;
  }
}
