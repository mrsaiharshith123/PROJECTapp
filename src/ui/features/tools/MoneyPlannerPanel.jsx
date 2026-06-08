import { useMemo, useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { Caption } from "../../primitives/Text.jsx";
import ExpenseSimulatorForm from "./ExpenseSimulatorForm.jsx";
import GoalsToolPanel from "./GoalsToolPanel.jsx";
import UnifiedScenariosPanel from "./UnifiedScenariosPanel.jsx";

function usePlannerTabs() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      { id: "afford", label: t("tools.planner.tabAfford") },
      { id: "whatif", label: t("tools.planner.tabScenarios") },
      { id: "goals", label: t("tools.planner.tabGoals") },
    ],
    [t],
  );
}

export default function MoneyPlannerPanel() {
  const { t } = useTranslation();
  const tabs = usePlannerTabs();
  const [tab, setTab] = useState("afford");

  return (
    <div className="ct-stack">
      <Caption>{t("tools.planner.intro")}</Caption>
      <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      {tab === "afford" && <ExpenseSimulatorForm />}
      {tab === "whatif" && <UnifiedScenariosPanel />}
      {tab === "goals" && <GoalsToolPanel />}
    </div>
  );
}
