import { useNavigate } from "react-router-dom";
import { Card, Button, Body, Caption } from "../index.js";
import { isFeatureUnlocked } from "../../constants/subscriptionTiers.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { getEffectiveDevTier, isForceShowAll, IS_DEV } from "../../utils/devOverride.js";
import { useAppTier } from "../../hooks/useAppTier.js";

/**
 * @param {{ featureId: string, children: import('react').ReactNode, fallback?: import('react').ReactNode }} props
 */
export function ProGate({ featureId, children, fallback = null }) {
  const { tier } = useAppTier();
  if (IS_DEV && isForceShowAll()) return children;
  const effectiveTier = getEffectiveDevTier(tier);
  if (isFeatureUnlocked(featureId, effectiveTier)) return children;
  if (fallback) return fallback;
  return <ProUpgradeNudge />;
}

function ProUpgradeNudge() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Card className="ed-stack-sm">
      <Body className="font-semibold">{t("proGate.proTitle")}</Body>
      <Caption className="block">{t("proGate.proHint")}</Caption>
      <Button type="button" variant="primary" onClick={() => navigate("/you/plans")}>
        {t("proGate.viewPlans")}
      </Button>
    </Card>
  );
}

export default ProGate;
