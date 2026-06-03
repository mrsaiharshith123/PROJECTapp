import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { showHomeRolePanel } from "../../../constants/modeExperience.js";
import RoleDashboardPanel from "./RoleDashboardPanel.jsx";
import SurvivalCard from "./SurvivalCard.jsx";
import BusinessCashflowPanel from "./BusinessCashflowPanel.jsx";

/** Mode-specific panels on Home — scores, pressure, and tips live in Financial pulse. */
export default function ModeIntelligenceSection() {
  const stable = useStabilityIntel();
  const { settings } = useCommitTrack();
  const mode = stable.mode;

  return (
    <div className="ct-stack">
      {showHomeRolePanel(settings) && <RoleDashboardPanel />}

      {(mode === "salaried" || mode === "power" || mode === "freelancer" || mode === "family") && (
        <SurvivalCard survival={stable.survival} mode={mode} />
      )}

      {mode === "business" && <BusinessCashflowPanel business={stable.business} />}
    </div>
  );
}
