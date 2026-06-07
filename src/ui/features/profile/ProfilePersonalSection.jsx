import { Card, Caption, Heading, inputClassName } from "../../index.js";
import ProfileManager from "./ProfileManager.jsx";
import AccountSettingsBlock from "./AccountSettingsBlock.jsx";
import ProfileAvatar from "./ProfileAvatar.jsx";
import { isSalariedFamily, resolveUserMode } from "../../../constants/modeExperience.js";
import { SELECTABLE_USER_MODES } from "../../../constants/userModes.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { applyColorScheme } from "../../../utils/theme.js";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";
import ProfileLanguageSection from "./ProfileLanguageSection.jsx";
import { getIncomeLabelKey } from "../../../constants/modeExperience.js";

const profileInputClass = inputClassName();

/**
 * @param {{ label: string, hint?: string, required?: boolean, children: import('react').ReactNode }} props
 */
function ProfileField({ label, hint, required, children }) {
  return (
    <div>
      <label className="ct-field-label">
        {label}
        {required && <span className="text-[var(--ct-danger)] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <Caption className="block mt-1">{hint}</Caption>}
    </div>
  );
}

export default function ProfilePersonalSection({ settings, updateSettings }) {
  const { t } = useTranslation();
  const salariedFamily = isSalariedFamily(settings);
  const incomeLabel = t(getIncomeLabelKey(settings));
  const userMode = resolveUserMode(settings);

  return (
    <Card className="ct-stack">
      <ProfileLanguageSection updateSettings={updateSettings} />

      <div>
        <Heading level={3}>{t("profile.aboutYou.title")}</Heading>
        <Caption className="block mt-1">{t("profile.aboutYou.subtitle")}</Caption>
      </div>

      <ProfileAvatar settings={settings} updateSettings={updateSettings} />

      <ProfileField label={t("profile.displayName")} hint={t("profile.displayNameHint")}>
        <input
          className={profileInputClass}
          value={settings.displayName ?? ""}
          onChange={(e) => updateSettings({ displayName: e.target.value })}
          placeholder={t("profile.displayNamePlaceholder")}
        />
      </ProfileField>

      <ProfileField label={t("profile.phone")} hint={t("profile.phoneHint")}>
        <input
          type="tel"
          className={profileInputClass}
          value={settings.phoneNumber ?? ""}
          onChange={(e) => updateSettings({ phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 12) })}
          placeholder="9876543210"
          inputMode="numeric"
        />
      </ProfileField>

      <ProfileField label={t("profile.appearance")}>
        <div className="ct-grid-3">
          {[
            { id: "light", labelKey: "appearance.light" },
            { id: "dark", labelKey: "appearance.dark" },
            { id: "system", labelKey: "appearance.system" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                updateSettings({ colorScheme: opt.id });
                applyColorScheme(opt.id);
              }}
              className={`ct-option-card !py-2.5 ${(settings.colorScheme || "system") === opt.id ? "ct-option-card-active" : ""}`}
            >
              <span className="text-xs font-semibold">{t(opt.labelKey)}</span>
            </button>
          ))}
        </div>
      </ProfileField>

      {salariedFamily && (
        <div className="ct-stack-sm pt-2 border-t border-[var(--ct-border)]">
          <Caption className="font-semibold block">{t("profile.familyProfiles.title")}</Caption>
          <Caption className="block">{t("profile.familyProfiles.subtitle")}</Caption>
          <ProfileManager />
        </div>
      )}

      <div className="ct-stack pt-2 border-t border-[var(--ct-border)]">
        <div>
          <Heading level={3}>{t("profile.moneySetup.title")}</Heading>
          <Caption className="block mt-1">{t("profile.moneySetup.subtitle")}</Caption>
        </div>

        <ProfileField label={`${incomeLabel} (₹)`} required hint={t("profile.incomeUsedHint")}>
          <input
            type="number"
            min="0"
            className={profileInputClass}
            value={settings.monthlyIncome === 0 ? "" : String(settings.monthlyIncome)}
            onChange={(e) => {
              const raw = e.target.value;
              updateSettings({ monthlyIncome: raw === "" ? 0 : Math.max(0, Number(raw) || 0) });
            }}
            placeholder={t("profile.incomePlaceholder")}
          />
        </ProfileField>

        {userMode === "salaried" && (
          <ProfileField label={t("profile.secondIncome")} hint={t("profile.secondIncomeHint")}>
            <input
              type="number"
              min="0"
              className={profileInputClass}
              value={!settings.secondaryMonthlyIncome ? "" : String(settings.secondaryMonthlyIncome)}
              onChange={(e) => {
                const raw = e.target.value;
                updateSettings({ secondaryMonthlyIncome: raw === "" ? 0 : Math.max(0, Number(raw) || 0) });
              }}
              placeholder="0"
            />
          </ProfileField>
        )}

        {userMode === "salaried" && (
          <ProfileField label={t("profile.incomeBasis")} hint={t(CALC_HELP.incomeEntryBasis)}>
            <select
              className={profileInputClass}
              value={settings.incomeEntryBasis === "gross" ? "gross" : "take_home"}
              onChange={(e) => updateSettings({ incomeEntryBasis: e.target.value === "gross" ? "gross" : "take_home" })}
            >
              <option value="take_home">{t("profile.incomeTakeHome")}</option>
              <option value="gross">{t("profile.incomeGross")}</option>
            </select>
          </ProfileField>
        )}

        <ProfileField label={t("profile.liquidSavings")} hint={t("profile.liquidSavingsHint")}>
          <input
            type="number"
            min="0"
            className={profileInputClass}
            value={settings.liquidSavings === 0 ? "" : String(settings.liquidSavings)}
            onChange={(e) => {
              const raw = e.target.value;
              updateSettings({ liquidSavings: raw === "" ? 0 : Math.max(0, Number(raw) || 0) });
            }}
          />
        </ProfileField>

        <ProfileField label={t("profile.userMode")} hint={t("mode.salariedDesc")}>
          <select
            className={profileInputClass}
            value={userMode}
            onChange={(e) => {
              const next = e.target.value;
              updateSettings({
                userMode: next,
                householdScope: next === "salaried" ? settings.householdScope || "single" : "single",
              });
            }}
          >
            {SELECTABLE_USER_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {t("mode.salaried")}
              </option>
            ))}
          </select>
        </ProfileField>

        {userMode === "salaried" && (
          <ProfileField label={t("profile.household")} hint={t("profile.householdHint")}>
            <select
              className={profileInputClass}
              value={settings.householdScope === "family" ? "family" : "single"}
              onChange={(e) => {
                const family = e.target.value === "family";
                updateSettings({
                  householdScope: family ? "family" : "single",
                  activeProfileId: family ? settings.activeProfileId : "default",
                  dependents: family ? settings.dependents : 0,
                });
              }}
            >
              <option value="single">{t("profile.householdSingle")}</option>
              <option value="family">{t("profile.householdFamily")}</option>
            </select>
          </ProfileField>
        )}

        {settings.householdScope === "family" && (
          <ProfileField label={t("profile.dependents")} hint={t("profile.dependentsHint")}>
            <input
              type="number"
              min="0"
              max="12"
              className={profileInputClass}
              value={settings.dependents === 0 ? "" : String(settings.dependents)}
              onChange={(e) => {
                const raw = e.target.value;
                updateSettings({
                  dependents: raw === "" ? 0 : Math.min(12, Math.max(0, Math.floor(Number(raw) || 0))),
                });
              }}
            />
          </ProfileField>
        )}
      </div>

      <AccountSettingsBlock />
    </Card>
  );
}
