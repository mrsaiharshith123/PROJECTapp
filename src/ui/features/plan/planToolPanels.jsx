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
import GoalsToolPanel from "../tools/GoalsToolPanel.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";

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
      return <IncomeTaxPanel />;
    case "loan":
      return (
        <LoanPayoffAdvisor
          commitments={commitments}
          lendings={lendings}
          settings={settings}
          getEffectiveStatus={getEffectiveStatus}
          getEffectiveLendingStatus={getEffectiveLendingStatus}
          todayStr={todayStr}
        />
      );
    case "safety":
      return <SafetyPlannerPanel />;
    case "expense":
      return <ExpenseSimulatorForm />;
    case "planner":
      return <MoneyPlannerPanel />;
    case "loantools":
      return <LoanToolsPanel />;
    case "chit":
      return (
        <ChitFundAdvisor
          commitments={commitments}
          settings={settings}
          getEffectiveStatus={getEffectiveStatus}
          todayStr={todayStr}
        />
      );
    case "invest":
      return <InvestSavingsPanel />;
    case "retirement":
      return <RetirementPlannerPanel />;
    case "bond":
      return <BondAdvisor monthlyIncome={income} />;
    case "wealth":
    case "scenarios":
      return <UnifiedScenariosPanel />;
    case "goals":
      return (
        <GoalsToolPanel
          initialTitle={goalDraft?.title || ""}
          initialType={goalDraft?.type || "save_amount"}
        />
      );
    default:
      return null;
  }
}
