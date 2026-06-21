import { useNetWorthIntel } from "../../../hooks/useNetWorthIntel.js";
import { SimulationPanel } from "../netWorth/NetWorthIntelligencePanels.jsx";

/** Plan Growth — 10-year wealth scenarios (PRESET_SCENARIOS). */
export default function PlanWealthSimulationPanel() {
  const intel = useNetWorthIntel();
  return <SimulationPanel simulationBase={intel.simulationBase} />;
}
