import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Caption, Body, Button } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { trackEvent, EVENTS } from "../../../services/analytics/perovoAnalytics.js";
import { SettingsGroup, SettingsGroupContent } from "./SettingsGroup.jsx";
import HouseholdSetupModal from "../modals/HouseholdSetupModal.jsx";

/**
 * Household scope — warm invitation when solo, status + shortcuts when family.
 * @param {{ settings: object, updateSettings: (p: object) => void }} props
 */
export default function HouseholdModeSection({ settings, updateSettings }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn, user, saveProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const isFamily = isSalariedFamily(settings);

  const switchToSolo = async () => {
    if (busy || !isFamily) return;
    setBusy(true);
    try {
      updateSettings({
        userMode: "salaried",
        householdScope: "single",
        activeProfileId: "default",
        secondaryMonthlyIncome: 0,
      });
      if (isLoggedIn && user?.id) {
        try {
          await saveProfile({ user_mode: "salaried", household_scope: "single" });
        } catch {
          /* local-first */
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const onSetupComplete = () => {
    trackEvent(EVENTS.HOUSEHOLD_JOINED, { source: "household_page" });
  };

  if (!isFamily) {
    return (
      <>
        <SettingsGroup title={t("settings.row.householdMode")} icon="users-three">
          <SettingsGroupContent className="ct-stack-sm">
            <button
              type="button"
              className="ct-household-invite-card ct-stat-tile teal w-full text-left"
              onClick={() => setSetupOpen(true)}
            >
              <div className="ct-row gap-3 items-center">
                <span className="ct-icon-tile ct-icon-tile-sm teal shrink-0" aria-hidden>
                  <CtIcon name="users-three" size={15} weight="duotone" />
                </span>
                <span className="min-w-0 flex-1">
                  <Body className="!text-sm font-semibold">{t("settings.household.inviteTitle")}</Body>
                  <Caption className="block mt-0.5">{t("settings.household.inviteSubtitle")}</Caption>
                </span>
                <CtIcon name="arrow-right" size={14} className="shrink-0 opacity-60" />
              </div>
            </button>
          </SettingsGroupContent>
        </SettingsGroup>
        <HouseholdSetupModal open={setupOpen} onClose={() => setSetupOpen(false)} onComplete={onSetupComplete} />
      </>
    );
  }

  return (
    <>
      <SettingsGroup title={t("settings.row.householdMode")} icon="users-three">
        <SettingsGroupContent className="ct-stack-sm">
          <div className="ct-stat-tile teal ct-stack-sm">
            <Body className="!text-sm ct-text-success font-semibold">{t("settings.household.active")}</Body>
            {settings.householdRoomName || settings.householdRoomMembers?.length ? (
              <Caption className="block">
                {settings.householdRoomName
                  ? t("household.commandHub.roomLine", {
                      name: settings.householdRoomName,
                      count: settings.householdRoomMembers?.length || 0,
                      limit: settings.householdMemberLimit || 4,
                    })
                  : t("settings.household.membersOnly")}
              </Caption>
            ) : null}
            <div className="ct-row gap-2 flex-wrap pt-1">
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
              {!settings.householdRoomId ? (
                <Button type="button" variant="outline" size="sm" className="!w-auto" onClick={() => setSetupOpen(true)}>
                  {t("household.hub.setupCta")}
                </Button>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="ct-btn ct-btn-ghost ct-btn-sm self-start !w-auto opacity-80"
            disabled={busy}
            onClick={switchToSolo}
          >
            {t("settings.household.switchSolo")}
          </button>
        </SettingsGroupContent>
      </SettingsGroup>
      <HouseholdSetupModal open={setupOpen} onClose={() => setSetupOpen(false)} onComplete={onSetupComplete} />
    </>
  );
}
