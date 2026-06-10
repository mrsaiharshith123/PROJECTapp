import { useNavigate } from "react-router-dom";
import { Card, Button, Body, Caption } from "../index.js";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { isFeatureUnlocked, POWER_FEATURES } from "../../constants/subscriptionTiers.js";
import { useTranslation } from "../../i18n/I18nProvider.js";

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
  const { t } = useTranslation();
  const isPower = POWER_FEATURES.has(featureId);
  return (
    <Card className="ct-stack-sm">
      <Body className="font-semibold">{isPower ? t("proGate.powerTitle") : t("proGate.proTitle")}</Body>
      <Caption className="block">{isPower ? t("proGate.powerHint") : t("proGate.proHint")}</Caption>
      <Button type="button" variant="primary" onClick={() => navigate("/profile#upgrade")}>
        {t("proGate.viewPlans")}
      </Button>
    </Card>
  );
}

export default ProGate;
