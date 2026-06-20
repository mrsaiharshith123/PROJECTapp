import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Caption, Body, Button } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { trackEvent, EVENTS } from "../../../services/analytics/perovoAnalytics.js";
import { SettingsGroup, SettingsGroupContent } from "./SettingsGroup.jsx";

/**
 * Enable / disable household (family) scope — salaried users only.
 * @param {{ settings: object, updateSettings: (p: object) => void }} props
 */
export default function HouseholdModeSection({ settings, updateSettings }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, user, saveProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const isFamily = isSalariedFamily(settings);

  const applyScope = async (family) => {
    if (busy) return;
    const nextScope = family ? "family" : "single";
    if ((settings.householdScope === "family") === family) return;

    setBusy(true);
    try {
      updateSettings({
        userMode: "salaried",
        householdScope: nextScope,
        activeProfileId: "default",
        ...(family ? {} : { secondaryMonthlyIncome: 0 }),
      });

      if (isLoggedIn && user?.id) {
        try {
          await saveProfile({
            user_mode: "salaried",
            household_scope: nextScope,
          });
        } catch {
          /* local-first — profile sync is best-effort */
        }
      }

      if (family) {
        trackEvent(EVENTS.HOUSEHOLD_JOINED, { source: "profile" });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsGroup title={t("settings.row.householdMode")} icon="users-three" description={t("profile.householdHint")}>
      <SettingsGroupContent className="ct-stack-sm">
        <button
          type="button"
          disabled={busy}
          onClick={() => applyScope(false)}
          className={`ct-option-card ${!isFamily ? "ct-option-card-active" : ""}`}
        >
          <span className="inline-flex mr-2 shrink-0" aria-hidden>
            <span className="ct-icon-tile ct-icon-tile-sm violet">
              <CtIcon name="user" size={18} weight="duotone" />
            </span>
          </span>
          <span className="font-semibold">{t("profile.householdSingle")}</span>
          <Caption className="block mt-1 ml-12">{t("mode.salariedDesc")}</Caption>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => applyScope(true)}
          className={`ct-option-card ${isFamily ? "ct-option-card-active" : ""}`}
        >
          <span className="inline-flex mr-2 shrink-0" aria-hidden>
            <span className="ct-icon-tile ct-icon-tile-sm teal">
              <CtIcon name="users-three" size={18} weight="duotone" />
            </span>
          </span>
          <span className="font-semibold">{t("profile.householdFamily")}</span>
          <Caption className="block mt-1 ml-12">{t("profile.householdHint")}</Caption>
        </button>

        {isFamily ? (
          <div className="ct-stack-sm pt-1">
            <Body className="!text-sm ct-text-success font-semibold">{t("settings.household.active")}</Body>
            <div className="ct-row gap-2 flex-wrap">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="!w-auto"
                onClick={() => navigate("/money/insights", { state: { openHousehold: true } })}
              >
                {t("settings.household.openAnalytics")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="!w-auto"
                onClick={() => navigate("/family-room")}
              >
                {t("profile.familyRoomLink")}
              </Button>
            </div>
          </div>
        ) : null}
      </SettingsGroupContent>
    </SettingsGroup>
  );
}
