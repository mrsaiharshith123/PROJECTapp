import { useMemo, useState } from "react";
import { formatInr } from "../../../constants/symbols.js";
import { buildQuickScenarioSummaries } from "../../../engines/quickScenarios.js";
import { buildUnifiedScenarioTiles, runWealthSimulation } from "../../../engines/scenarioCatalog.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { useNetWorthIntel } from "../../../hooks/useNetWorthIntel.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Caption } from "../../primitives/Text.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";

/**
 * Scenario analysis — only tiles that apply to the user's income, bills, and debt.
 */
export default function UnifiedScenariosPanel() {
  const { t } = useTranslation();
  const { commitments, settings, getEffectiveStatus } = usePerovo();
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
      <div className="ed-stack text-sm">
        <Caption>{t("tools.planner.scenariosEmpty")}</Caption>
        <Caption className="ed-field-note block">{t("tools.planner.setIncomeUnlock")}</Caption>
      </div>
    );
  }

  return (
    <div className="ed-stack text-sm">
      <ToolAnswerHero
        tone="survival"
        label={t("tools.planner.runwayLabel")}
        value={
          pack.survivalMonths != null
            ? t("tools.planner.runwayMonths", { months: Math.min(99, pack.survivalMonths) })
            : "—"
        }
        subtitle={active?.label}
      />
      <Caption>{t("tools.planner.whatifIntro")}</Caption>
      <Caption>
        {t("tools.planner.baselineFree", { amount: formatInr(pack.baselineFree) })}
        {pack.survivalMonths != null
          ? t("tools.planner.survivalMonths", { months: Math.min(99, pack.survivalMonths) })
          : ""}
      </Caption>

      <div className="ed-row flex-wrap gap-2">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            className={`ed-chip ${activeId === tile.id ? "active" : ""}`}
            onClick={() => setPickedId(tile.id)}
          >
            {tile.label}
          </button>
        ))}
      </div>

      {active?.kind === "cashflow" && (
        <div className="ed-inset-green ed-stack-sm">
          <p className="ed-stat-label">{active.row.label}</p>
          <p className="ed-stat-value text-sm ed-link">{active.row.headline}</p>
          <p className="ed-stat-value text-sm">{active.row.detail}</p>
        </div>
      )}

      {active?.kind === "wealth" && wealthResult && (
        <div className="ed-grid-2 gap-3">
          <div className="ed-inset-green">
            <p className="ed-stat-label">{t("netWorth.sim.projectedNw")}</p>
            <p className="ed-stat-value ed-numeral">{formatInr(wealthResult.projectedNetWorth)}</p>
          </div>
          <div className="ed-inset">
            <p className="ed-stat-label">{t("netWorth.sim.delta")}</p>
            <p className={`ed-stat-value ed-numeral ${wealthResult.deltaNetWorth >= 0 ? "text-emerald-500" : "text-red-400"}`}>
              {wealthResult.deltaNetWorth >= 0 ? "+" : ""}
              {formatInr(wealthResult.deltaNetWorth)}
            </p>
          </div>
          <div className="ed-inset-amber">
            <p className="ed-stat-label">{t("netWorth.sim.survival")}</p>
            <p className="ed-stat-value text-sm">
              {t("netWorth.liquidity.months", {
                count: Math.min(99, wealthResult.survivabilityMonths),
              })}
            </p>
          </div>
          <div className="ed-inset">
            <p className="ed-stat-label">{t("netWorth.sim.stability")}</p>
            <p className="ed-stat-value text-sm">{t(wealthResult.stabilityKey)}</p>
          </div>
        </div>
      )}

      {income <= 0 && <Caption className="ed-field-note block">{t("tools.planner.setIncomeUnlock")}</Caption>}
    </div>
  );
}
