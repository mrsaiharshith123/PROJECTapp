import { useStabilityIntel } from "../../hooks/useStabilityIntel.js";
import RoleDashboardPanel from "./RoleDashboardPanel.jsx";
import SurvivalCard from "./stability/SurvivalCard.jsx";
import StressContributorsCard from "./stability/StressContributorsCard.jsx";
import EmergencyFundCard from "./stability/EmergencyFundCard.jsx";
import InsightList from "./stability/InsightList.jsx";
import Card from "../Card.jsx";
import { formatInr } from "../../constants/symbols.js";
import { showHomeRolePanel, showSalariedStabilityCards } from "../../constants/modeExperience.js";

function BusinessPanel({ business }) {
  if (!business) return null;
  return (
    <Card className="space-y-2">
      <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">Business cashflow</h2>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Receivables</p>
          <p className="font-semibold">{formatInr(business.totalReceivables)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Overdue recv.</p>
          <p className="font-semibold text-amber-700">{business.overdueReceivables}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Vendor dues</p>
          <p className="font-semibold">{formatInr(business.vendorDue)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Stability</p>
          <p className="font-semibold">{business.stabilityLabel}</p>
        </div>
      </div>
    </Card>
  );
}

/** Mode-aware stability on Home — paycheck & salary flow live in Analytics. */
export default function ModeIntelligenceSection() {
  const stable = useStabilityIntel();
  const mode = stable.mode;

  return (
    <div className="space-y-4">
      {showHomeRolePanel(mode) && <RoleDashboardPanel />}

      {(mode === "salaried" || mode === "power" || mode === "freelancer" || mode === "family") && (
        <SurvivalCard survival={stable.survival} mode={mode} />
      )}

      {showSalariedStabilityCards(mode) && (
        <>
          <StressContributorsCard stress={stable.stress} />
          <EmergencyFundCard emergency={stable.emergency} />
        </>
      )}

      {mode === "business" && <BusinessPanel business={stable.business} />}

      {stable.lifestyle?.message && (
        <Card className="bg-violet-50/80 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900">
          <p className="text-sm text-violet-900 dark:text-violet-200">{stable.lifestyle.message}</p>
        </Card>
      )}

      {stable.stabilityInsights?.length > 0 && (
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">Stability insights</h2>
          <InsightList insights={stable.stabilityInsights} limit={8} />
        </Card>
      )}
    </div>
  );
}
