import { useMemo } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { formatInr } from "../../../constants/symbols.js";
import { Stack } from "../../primitives/Stack.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import FamilyModeDashboard from "./FamilyModeDashboard.jsx";

/** Mode-specific home intelligence — household only; salaried survival lives in Financial pulse. */
export default function ModeIntelligenceSection() {
  const { settings } = usePerovo();
  const stable = useStabilityIntel();
  const intel = useCommitIntel();
  const { t } = useTranslation();
  const mode = stable.mode || getExperienceMode(settings);

  const glanceTiles = useMemo(() => {
    if (mode !== "family" || !stable.family) return [];
    const pressure = intel.stability?.score ?? 0;
    const runway = stable.survival?.survivalMonths ?? 0;
    return [
      {
        id: "pressure",
        icon: "chart-bar",
        tone: "indigo",
        label: t("pulse.pressure"),
        value: String(pressure),
      },
      {
        id: "runway",
        icon: "hourglass",
        tone: "amber",
        label: t("family.dashboard.householdRunway"),
        value: t("netWorth.liquidity.months", { count: runway }),
      },
      {
        id: "school",
        icon: "backpack",
        tone: "teal",
        label: t("family.dashboard.schoolFeesOpen"),
        value: formatInr(stable.family.schoolOpen ?? 0),
      },
    ];
  }, [mode, stable.family, stable.survival?.survivalMonths, intel.stability?.score, t]);

  if (mode !== "family") return null;

  return (
    <Stack gap="md" className="ct-mode-intelligence">
      {glanceTiles.length > 0 ? (
        <div className="ct-grid-2">
          {glanceTiles.map((tile) => (
            <div key={tile.id} className={`ct-stat-tile ${tile.tone}`}>
              <div className="ct-row gap-2 items-start">
                <span className={`ct-icon-tile ct-icon-tile-sm ${tile.tone} shrink-0`} aria-hidden>
                  <CtIcon name={tile.icon} size={18} />
                </span>
                <div className="min-w-0">
                  <p className="ct-stat-tile-label">{tile.label}</p>
                  <p className="ct-stat-tile-value truncate">{tile.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <FamilyModeDashboard />
    </Stack>
  );
}
