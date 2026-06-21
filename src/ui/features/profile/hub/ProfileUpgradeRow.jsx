import { useState } from "react";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { getTier } from "../../../../utils/tierAccess.js";
import { Button, Caption } from "../../../index.js";
import PlansModal from "../PlansModal.jsx";

/** Conditional Pro/Power upsell row (You tab block 3). */
export default function ProfileUpgradeRow({ settings }) {
  const { t } = useTranslation();
  const [plansOpen, setPlansOpen] = useState(false);
  const tier = getTier(settings);

  if (tier === "power") return null;

  const isFree = tier === "free";

  return (
    <>
      <div className={`ct-profile-upgrade-row ct-reveal ct-reveal-delay-2 ${isFree ? "ct-profile-upgrade-free" : "ct-profile-upgrade-pro"}`}>
        <div className="min-w-0 flex-1">
          <p className="ct-profile-upgrade-title">
            {isFree ? t("profileHub.upgradeProTitle") : t("profileHub.upgradePowerTitle")}
          </p>
          <Caption className="block mt-0.5 opacity-80">
            {isFree ? t("profileHub.upgradeProBody") : t("profileHub.upgradePowerBody")}
          </Caption>
        </div>
        <Button type="button" size="sm" variant="primary" className="!w-auto shrink-0" onClick={() => setPlansOpen(true)}>
          {t("profileHub.upgradeCta")}
        </Button>
      </div>
      <PlansModal open={plansOpen} onClose={() => setPlansOpen(false)} />
    </>
  );
}
