import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Caption, Heading, inputClassName } from "../../index.js";
import { ALL_APP_LANGUAGES } from "../../../i18n/languages.js";
import ProfileManager from "./ProfileManager.jsx";
import AccountSettingsBlock from "./AccountSettingsBlock.jsx";
import ProfileAvatar from "./ProfileAvatar.jsx";
import { isSalariedFamily, resolveUserMode } from "../../../constants/modeExperience.js";
import { normalizeHouseholdMembers } from "../../../engines/householdEntity.js";
import { SELECTABLE_USER_MODES } from "../../../constants/userModes.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { applyColorScheme } from "../../../utils/theme.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
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

/**
 * @param {{ settings: object, updateSettings: (p: object) => void, part?: 'full' | 'appearance' | 'identity' | 'money' | 'account' }} props
 */
/** @param {{ updateSettings: (p: object) => void }} props */
function LanguagePickerBlock({ updateSettings }) {
  const { t, locale } = useTranslation();
  const [savedFlash, setSavedFlash] = useState(false);

  const onSelect = (code) => {
    if (code === locale) return;
    updateSettings({ appLanguage: code });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className="ct-stack">
      <div>
        <Heading level={3}>{t("profile.language")}</Heading>
        <Caption className="block mt-1">{t("profile.languageHint")}</Caption>
      </div>
      <div className="ct-grid-2">
        {ALL_APP_LANGUAGES.map((lang) => {
          const active = locale === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onSelect(lang.code)}
              className={`ct-option-card !py-3 !text-left ${active ? "ct-option-card-active" : ""}`}
              aria-pressed={active}
            >
              <span className="block text-sm font-semibold text-[var(--ct-text)]">{lang.nativeName}</span>
              <span className="block text-xs text-[var(--ct-text-muted)] mt-0.5">{lang.englishName}</span>
            </button>
          );
        })}
      </div>
      {savedFlash && (
        <Caption className="text-[var(--ct-success)] font-semibold">{t("profile.languageSaved")}</Caption>
      )}
    </div>
  );
}

export default function ProfilePersonalSection({ settings, updateSettings, part = "full" }) {
  const { t } = useTranslation();
  const salariedFamily = isSalariedFamily(settings);
  const incomeLabel = t(getIncomeLabelKey(settings));
  const userMode = resolveUserMode(settings);
  const showAppearance = part === "full" || part === "appearance";
  const showIdentity = part === "full" || part === "identity";
  const showMoney = part === "full" || part === "money";
  const showAccount = part === "full" || part === "account";

  const appearanceField = (
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
  );

  return (
    <Card className="ct-stack">
      {showAppearance && <LanguagePickerBlock updateSettings={updateSettings} />}
      {showAppearance && appearanceField}

      {showIdentity && (
        <>
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

          {salariedFamily && (
            <div className="ct-stack-sm pt-2 border-t border-[var(--ct-border)]">
              <Caption className="font-semibold block">{t("profile.familyProfiles.title")}</Caption>
              <Caption className="block">{t("profile.familyProfiles.subtitle")}</Caption>
              <ProfileManager />
            </div>
          )}
        </>
      )}

      {showMoney && (
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

        {userMode === "salaried" && (
          <ProfileField label={t("profile.salaryCreditDay")} hint={t("profile.salaryCreditDayHint")}>
            <input
              type="number"
              min="1"
              max="31"
              className={profileInputClass}
              value={settings.salaryCreditDay == null ? "" : String(settings.salaryCreditDay)}
              onChange={(e) => {
                const raw = e.target.value;
                updateSettings({
                  salaryCreditDay: raw === "" ? null : Math.min(31, Math.max(1, Math.floor(Number(raw) || 1))),
                });
              }}
              placeholder="1"
            />
            <Link to="/paycheck" className="ct-link text-xs font-semibold mt-2 inline-block">
              {t("profile.paycheckLink")}
            </Link>
          </ProfileField>
        )}

        <ProfileField label={t("profile.liquidAssets")} hint={t("profile.liquidAssetsHint")}>
          <Caption className="block">
            {t("profile.liquidAssetsCta")}{" "}
            <Link to="/profile" className="ct-link">
              {t("netWorth.tab.assets")}
            </Link>
          </Caption>
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
                {t("mode.salaried")}
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

        {settings.householdScope === "family" && (
          <ProfileField label={t("profile.householdMembers.label")} hint={t("profile.householdMembers.hint")}>
            <div className="ct-stack-sm">
              {normalizeHouseholdMembers(settings.householdMembers).map((m, i) => (
                <div key={m.id} className="ct-row gap-2 flex-wrap">
                  <input
                    className={profileInputClass}
                    value={m.label}
                    onChange={(e) => {
                      const members = normalizeHouseholdMembers(settings.householdMembers);
                      members[i] = { ...members[i], label: e.target.value.slice(0, 40) };
                      updateSettings({ householdMembers: members });
                    }}
                    placeholder={t("profile.householdMembers.namePlaceholder")}
                  />
                  <select
                    className={profileInputClass}
                    value={m.role}
                    onChange={(e) => {
                      const members = normalizeHouseholdMembers(settings.householdMembers);
                      members[i] = { ...members[i], role: e.target.value };
                      updateSettings({ householdMembers: members });
                    }}
                  >
                    <option value="owner">Owner</option>
                    <option value="spouse">Spouse</option>
                    <option value="dependent">Dependent</option>
                    <option value="parent">Parent</option>
                    <option value="contributor">Contributor</option>
                  </select>
                </div>
              ))}
              <button
                type="button"
                className="ct-btn ct-btn-ghost !text-sm self-start"
                onClick={() => {
                  const members = normalizeHouseholdMembers(settings.householdMembers);
                  members.push({
                    id: `member-${Date.now()}`,
                    label: "Member",
                    role: "contributor",
                    incomeShare: 0,
                    permission: "shared_edit",
                  });
                  updateSettings({ householdMembers: members });
                }}
              >
                Add member
              </button>
            </div>
          </ProfileField>
        )}
        </div>
      )}

      {showAccount && <AccountSettingsBlock />}
    </Card>
  );
}
