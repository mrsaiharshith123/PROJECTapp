import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { Stack } from "../../primitives/Stack.jsx";
import FamilyModeDashboard from "./FamilyModeDashboard.jsx";

/** Mode-specific home intelligence — household only; salaried survival lives in Financial pulse. */
export default function ModeIntelligenceSection() {
  const { settings } = useCommitTrack();
  const stable = useStabilityIntel();
  const mode = stable.mode || getExperienceMode(settings);

  if (mode !== "family") return null;

  return (
    <Stack gap="md">
      <FamilyModeDashboard />
    </Stack>
  );
}
