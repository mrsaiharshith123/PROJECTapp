import { useMemo } from "react";
import { useNetWorthIntel } from "../../../hooks/useNetWorthIntel.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";
import { SimulationPanel } from "../netWorth/NetWorthIntelligencePanels.jsx";
import { getApplicableWealthScenarios } from "../../../engines/scenarioCatalog.js";
import { runWealthSimulation } from "../../../engines/netWorth/simulation.js";

/** Plan Growth — 10-year wealth scenarios (PRESET_SCENARIOS). */
export default function PlanWealthSimulationPanel() {
  const { t } = useTranslation();
  const intel = useNetWorthIntel();
  const simulationBase = intel.simulationBase;

  const headline = useMemo(() => {
    const scenarios = getApplicableWealthScenarios(simulationBase || {});
    const scenario = scenarios[0];
    if (!scenario) return null;
    const result = runWealthSimulation(simulationBase, scenario);
    return result?.projectedNetWorth ?? null;
  }, [simulationBase]);

  return (
    <div className="ct-stack">
      {headline != null ? (
        <div className="ct-hero-card wealth">
          <div className="ct-hero-glow teal" aria-hidden />
          <p className="ct-hero-label">{t("netWorth.sim.title")}</p>
          <p className="ct-hero-number">{formatInr(headline)}</p>
          <p className="ct-stat-tile-label mt-1">{t("netWorth.sim.subtitle")}</p>
        </div>
      ) : null}
      <SimulationPanel simulationBase={simulationBase} />
    </div>
  );
}
