import { useMemo } from "react";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { useCommitIntel } from "./useCommitIntel.js";
import { useStabilityIntel } from "./useStabilityIntel.js";
import { buildFamilyCommandCenter } from "../engines/familyCommandCenter.js";
import { isSalariedFamily } from "../constants/modeExperience.js";

/** Family Financial OS snapshot for Home command center. */
export function useFamilyCommandIntel() {
  const ctx = useCommitTrack();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();

  return useMemo(() => {
    if (!isSalariedFamily(ctx.settings)) return null;

    return buildFamilyCommandCenter({
      settings: ctx.settings,
      commitments: ctx.commitments,
      goals: ctx.goals,
      getEffectiveStatus: ctx.getEffectiveStatus,
      todayStr: ctx.todayStr,
      pressureScore: intel.stability?.score ?? null,
      survivalMonths: stable.survival?.survivalMonths ?? null,
      overdueCount: stable.overdueCount ?? 0,
      aheadPlan: stable.ahead,
      pressureIntel: stable.pressureIntel,
    });
  }, [
    ctx.settings,
    ctx.commitments,
    ctx.goals,
    ctx.getEffectiveStatus,
    ctx.todayStr,
    intel.stability?.score,
    stable.survival?.survivalMonths,
    stable.overdueCount,
    stable.ahead,
    stable.pressureIntel,
  ]);
}
