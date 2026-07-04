import { useMemo, useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { ProGate } from "../../patterns/ProGate.jsx";
import { Caption } from "../../primitives/Text.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { MetricOwnerLink } from "../../patterns/MetricOwnerLink.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { formatInr } from "../../../constants/symbols.js";
import ExpenseSimulatorForm from "./ExpenseSimulatorForm.jsx";

function usePlannerTabs() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      { id: "afford", label: t("tools.planner.tabAfford") },
      { id: "whatif", label: t("tools.planner.tabScenarios") },
    ],
    [t],
  );
}

export default function MoneyPlannerPanel() {
  const { t } = useTranslation();
  const tabs = usePlannerTabs();
  const [tab, setTab] = useState("afford");
  const intel = useCommitIntel();
  const safeSpend = Math.max(0, Math.round(intel.stability?.freeMoney ?? 0));

  return (
    <div className="ed-stack">
      <ToolAnswerHero
        tone="pressure"
        label={t("tools.planner.safeSpendLabel")}
        value={formatInr(safeSpend)}
      />
      <div className="ed-inset-green">
        <p className="ed-stat-label">{t("tools.advisor.plannerHint")}</p>
        <Caption className="block mt-1">{t("tools.planner.intro")}</Caption>
      </div>
      <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      {tab === "afford" && <ExpenseSimulatorForm />}
      {tab === "whatif" && (
        <ProGate featureId="survival_scenarios">
          <div className="ed-inset">
            <Caption>{t("dedup.survivalOnInsights")}</Caption>
            <MetricOwnerLink label={t("money.tab.insights")} to="/insights" />
          </div>
        </ProGate>
      )}
    </div>
  );
}
