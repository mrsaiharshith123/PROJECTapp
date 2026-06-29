import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { tierHasFeature } from "../../../../utils/tierAccess.js";
import { isSalariedFamily } from "../../../../constants/modeExperience.js";
import ProfileManager from "../ProfileManager.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

/** Name, phone, avatar, and family profiles. */
export default function YouPersonalPage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = usePerovo();
  const { user } = useAuth();
  const salariedFamily = isSalariedFamily(settings);

  const displayName = settings.displayName || "";
  const initials = (displayName || user?.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = settings.profileImageUrl || null;

  return (
    <YouSubPageShell titleKey="settings.row.personalDetails">
      <div className="ed-you-section">
        <div className="ed-ins-kicker">{t("profile.aboutYou.title")}</div>

        <div className="ed-you-avatar-section">
          <div className="ed-you-avatar-large">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>
          <div>
            <div className="ed-you-photo-caption">{t("profile.photoLabel")}</div>
            <label style={{ cursor: "pointer" }}>
              <span className="ed-you-avatar-upload">{t("profile.uploadPhoto")}</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    updateSettings({ profileImageUrl: ev.target?.result });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
        </div>

        <div className="ed-you-field">
          <div className="ed-you-field-label">{t("profile.displayName")}</div>
          <input
            className="ed-you-input"
            value={settings.displayName ?? ""}
            onChange={(e) => updateSettings({ displayName: e.target.value })}
            placeholder={t("profile.displayNamePlaceholder")}
          />
          <div className="ed-you-field-hint">{t("profile.displayNameHint")}</div>
        </div>

        <div className="ed-you-field">
          <div className="ed-you-field-label">{t("profile.phone")}</div>
          <input
            className="ed-you-input"
            type="tel"
            inputMode="numeric"
            value={settings.phoneNumber ?? ""}
            onChange={(e) =>
              updateSettings({ phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 12) })
            }
            placeholder={t("profile.phonePlaceholder")}
          />
          <div className="ed-you-field-hint">{t("profile.phoneHint")}</div>
        </div>
      </div>

      {!salariedFamily && tierHasFeature("multiple_profiles", settings) ? (
        <div className="ed-you-section">
          <div className="ed-ins-kicker">{t("profile.profilesTitle")}</div>
          <ProfileManager />
        </div>
      ) : null}
    </YouSubPageShell>
  );
}
