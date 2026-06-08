import { useMemo, useState } from "react";
import { formatInr } from "../../../constants/symbols.js";
import { buildQuickScenarioSummaries } from "../../../engines/quickScenarios.js";
import { buildUnifiedScenarioTiles, runWealthSimulation } from "../../../engines/scenarioCatalog.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { useNetWorthIntel } from "../../../hooks/useNetWorthIntel.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Caption, Body } from "../../primitives/Text.jsx";

/**
 * Scenario analysis — only tiles that apply to the user's income, bills, and debt.
 */
export default function UnifiedScenariosPanel() {
  const { t } = useTranslation();
  const { commitments, settings, getEffectiveStatus } = useCommitTrack();
  const intel = useNetWorthIntel();
  const mode = getExperienceMode(settings);
  const income = combinedMonthlyIncome(settings);
  const primary = Math.max(0, Number(settings.monthlyIncome) || 0);
  const secondary = Math.max(0, Number(settings.secondaryMonthlyIncome) || 0);

  const pack = useMemo(
    () =>
      buildQuickScenarioSummaries({
        primaryIncome: primary,
        secondaryMonthlyIncome: secondary,
        commitments,
        getEffectiveStatus,
        liquidSavings: settings.liquidSavings,
        mode,
      }),
    [primary, secondary, commitments, getEffectiveStatus, settings.liquidSavings, mode],
  );

  const tiles = useMemo(
    () =>
      buildUnifiedScenarioTiles({
        pack,
        simulationBase: intel.simulationBase,
        t,
      }),
    [pack, intel.simulationBase, t],
  );

  const [pickedId, setPickedId] = useState("");
  const activeId = useMemo(() => {
    if (!tiles.length) return "";
    if (pickedId && tiles.some((tile) => tile.id === pickedId)) return pickedId;
    return tiles[0].id;
  }, [tiles, pickedId]);

  const active = tiles.find((tile) => tile.id === activeId) || tiles[0];
  const wealthResult =
    active?.kind === "wealth" ? runWealthSimulation(intel.simulationBase, active.scenario) : null;

  if (tiles.length === 0) {
    return (
      <div className="ct-stack text-sm">
        <Caption>{t("tools.planner.scenariosEmpty")}</Caption>
        <Caption className="ct-text-warning block">{t("tools.planner.setIncomeUnlock")}</Caption>
      </div>
    );
  }

  return (
    <div className="ct-stack text-sm">
      <Caption>{t("tools.planner.whatifIntro")}</Caption>
      <Caption>
        {t("tools.planner.baselineFree", { amount: formatInr(pack.baselineFree) })}
        {pack.survivalMonths != null
          ? t("tools.planner.survivalMonths", { months: Math.min(99, pack.survivalMonths) })
          : ""}
      </Caption>

      <div className="ct-row flex-wrap gap-2">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className={`ct-chip ${activeId === tile.id ? "ct-chip-active" : ""}`}
            onClick={() => setPickedId(tile.id)}
          >
            {tile.label}
          </button>
        ))}
      </div>

      {active?.kind === "cashflow" && (
        <div className="ct-card-flat ct-stack-sm !p-3 ct-nw-sim-result">
          <Body className="!text-sm font-semibold">{active.row.label}</Body>
          <Caption className="ct-text-accent block">{active.row.headline}</Caption>
          <Caption className="block">{active.row.detail}</Caption>
        </div>
      )}

      {active?.kind === "wealth" && wealthResult && (
        <div className="ct-nw-sim-result ct-card-flat !p-3">
          <div className="ct-grid-2 gap-3">
            <div>
              <Caption>{t("netWorth.sim.projectedNw")}</Caption>
              <Body className="ct-numeral font-bold">{formatInr(wealthResult.projectedNetWorth)}</Body>
            </div>
            <div>
              <Caption>{t("netWorth.sim.delta")}</Caption>
              <Body
                className={`ct-numeral font-bold ${wealthResult.deltaNetWorth >= 0 ? "text-emerald-500" : "text-red-400"}`}
              >
                {wealthResult.deltaNetWorth >= 0 ? "+" : ""}
                {formatInr(wealthResult.deltaNetWorth)}
              </Body>
            </div>
            <div>
              <Caption>{t("netWorth.sim.survival")}</Caption>
              <Body className="font-bold">
                {t("netWorth.liquidity.months", {
                  count: Math.min(99, wealthResult.survivabilityMonths),
                })}
              </Body>
            </div>
            <div>
              <Caption>{t("netWorth.sim.stability")}</Caption>
              <Body className="font-bold">{t(wealthResult.stabilityKey)}</Body>
            </div>
          </div>
        </div>
      )}

      {income <= 0 && <Caption className="ct-text-warning block">{t("tools.planner.setIncomeUnlock")}</Caption>}
    </div>
  );
}
