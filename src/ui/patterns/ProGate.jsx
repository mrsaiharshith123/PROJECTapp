import { useNavigate } from "react-router-dom";
import { Card, Button, Body, Caption } from "../index.js";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { isFeatureUnlocked, POWER_FEATURES } from "../../constants/subscriptionTiers.js";

/**
 * @param {{ featureId: string, children: import('react').ReactNode, fallback?: import('react').ReactNode }} props
 */
export function ProGate({ featureId, children, fallback = null }) {
  const { settings } = useCommitTrack();
  const tier = settings.subscriptionTier || "free";
  if (isFeatureUnlocked(featureId, tier)) return children;
  if (fallback) return fallback;
  return <ProUpgradeNudge featureId={featureId} />;
}

function ProUpgradeNudge({ featureId }) {
  const navigate = useNavigate();
  const isPower = POWER_FEATURES.has(featureId);
  return (
    <Card className="ct-stack-sm">
      <Body className="font-semibold">{isPower ? "Power feature" : "Pro feature"}</Body>
      <Caption className="block">
        {isPower
          ? "A Power subscription unlocks household tools, bond analysis, and CA-ready exports."
          : "A Pro subscription unlocks advanced tools, reports, and extended analysis."}
      </Caption>
      <Button type="button" variant="primary" onClick={() => navigate("/profile#upgrade")}>
        View plans
      </Button>
    </Card>
  );
}

export default ProGate;
