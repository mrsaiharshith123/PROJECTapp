import { useState } from "react";
import { Link } from "react-router-dom";
import { Caption, Body, Button, inputClassName } from "../../index.js";
import { formatInr } from "../../../constants/symbols.js";
import { ALL_APP_LANGUAGES } from "../../../i18n/languages.js";
import AccountSettingsBlock from "./AccountSettingsBlock.jsx";
import ProfileAvatar from "./ProfileAvatar.jsx";
import { isSalariedFamily, resolveUserMode } from "../../../constants/modeExperience.js";
import { SELECTABLE_USER_MODES } from "../../../constants/userModes.js";
import { tierHasFeature } from "../../../utils/tierAccess.js";
import ProfileManager from "./ProfileManager.jsx";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { applyColorScheme } from "../../../utils/theme.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { getIncomeLabelKey } from "../../../constants/modeExperience.js";
import { SettingsGroup, SettingsGroupContent } from "./SettingsGroup.jsx";

const profileInputClass = `${inputClassName()} ct-input-tint`;

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
    <SettingsGroup title={t("profile.language")} icon="book" description={t("profile.languageHint")}>
      <SettingsGroupContent className="ct-stack">
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
        {savedFlash ? (
          <div className="ct-stat-tile teal">
            <p className="ct-stat-tile-label">{t("profile.languageSaved")}</p>
          </div>
        ) : null}
      </SettingsGroupContent>
    </SettingsGroup>
  );
}

/**
 * @param {{ settings: object, updateSettings: (p: object) => void, part?: 'full' | 'profile' | 'appearance' | 'identity' | 'money' | 'account' }} props
 */
export default function ProfilePersonalSection({
  settings,
  updateSettings,
  part = "full",
}) {
  const { t } = useTranslation();
  const salariedFamily = isSalariedFamily(settings);
  const incomeLabel = t(getIncomeLabelKey(settings));
  const userMode = resolveUserMode(settings);
  const isProfileHub = part === "profile";
  const showAppearance = part === "full" || part === "appearance";
  const showIdentity = part === "full" || part === "identity" || isProfileHub;
  const showMoney = part === "full" || part === "money" || isProfileHub;
  const showAccount = part === "full" || part === "account" || isProfileHub;

  const appearanceField = (
    <SettingsGroup title={t("profile.appearance")} icon="palette" description={t("profile.aboutYou.subtitle")}>
      <SettingsGroupContent>
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
                className={`ct-option-card !py-2.5 ${(settings.colorScheme || "dark") === opt.id ? "ct-option-card-active" : ""}`}
              >
                <span className="text-xs font-semibold">{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </ProfileField>
      </SettingsGroupContent>
    </SettingsGroup>
  );

  return (
    <div className="ct-stack">
      {showAppearance && <LanguagePickerBlock updateSettings={updateSettings} />}
      {showAppearance && appearanceField}

      {showIdentity && (
        <SettingsGroup title={t("profile.aboutYou.title")} icon="user" description={t("profile.aboutYou.subtitle")}>
          <SettingsGroupContent className="ct-stack">
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

            {!salariedFamily && tierHasFeature("multiple_profiles", settings) && (
              <div className="ct-stack-sm pt-2 border-t border-[var(--ct-border)]">
                <ProfileManager />
              </div>
            )}
          </SettingsGroupContent>
        </SettingsGroup>
      )}

      {showMoney && (
        <SettingsGroup title={t("profile.moneySetup.title")} icon="currency-inr" description={t("profile.moneySetup.subtitle")}>
          <SettingsGroupContent className="ct-stack">
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

            {userMode === "salaried" && salariedFamily && (
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

            {userMode === "salaried" && !salariedFamily && (
              <SideIncomeSection settings={settings} updateSettings={updateSettings} t={t} profileInputClass={profileInputClass} />
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

            {userMode === "salaried" ? (
              <Caption className="block mt-2">{t("settings.household.personalHint")}</Caption>
            ) : null}
          </SettingsGroupContent>
        </SettingsGroup>
      )}

      {showAccount && <AccountSettingsBlock />}
    </div>
  );
}

const SIDE_INCOME_TYPES = ["rental", "freelance", "tuition", "other"];

function SideIncomeSection({ settings, updateSettings, t, profileInputClass }) {
  const sideIncomes = settings.sideIncomes || [];
  const [draft, setDraft] = useState({ label: "", monthlyAmount: "", type: "other" });
  const [adding, setAdding] = useState(false);

  const saveEntry = () => {
    const amt = Math.max(0, Number(draft.monthlyAmount) || 0);
    if (!draft.label.trim() || amt <= 0) return;
    updateSettings({
      sideIncomes: [
        ...sideIncomes,
        {
          id: `side-${Date.now()}`,
          label: draft.label.trim(),
          monthlyAmount: amt,
          type: SIDE_INCOME_TYPES.includes(draft.type) ? draft.type : "other",
        },
      ],
    });
    setDraft({ label: "", monthlyAmount: "", type: "other" });
    setAdding(false);
  };

  return (
    <div className="ct-stack-sm">
      <Body className="font-semibold">{t("profile.sideIncome.title")}</Body>
      <Caption className="block">{t("profile.sideIncome.hint")}</Caption>
      {sideIncomes.length === 0 ? (
        <Caption>{t("profile.sideIncome.empty")}</Caption>
      ) : (
        sideIncomes.map((inc) => (
          <div key={inc.id} className="ct-settings-row ct-settings-row-static">
            <span className="ct-icon-tile ct-icon-tile-sm teal shrink-0" aria-hidden>
              ₹
            </span>
            <div className="min-w-0 flex-1">
              <Body className="font-semibold truncate">{inc.label}</Body>
              <Caption>
                {t(`profile.sideIncome.type.${inc.type}`)} · {formatInr(Number(inc.monthlyAmount) || 0)}/mo
              </Caption>
            </div>
            <button
              type="button"
              className="ct-link !text-xs shrink-0"
              onClick={() =>
                updateSettings({ sideIncomes: sideIncomes.filter((s) => s.id !== inc.id) })
              }
            >
              {t("common.delete")}
            </button>
          </div>
        ))
      )}
      {adding ? (
        <div className="ct-stack-sm">
          <input
            className={profileInputClass}
            value={draft.label}
            onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
            placeholder={t("profile.sideIncome.labelPh")}
          />
          <input
            type="number"
            min="0"
            className={profileInputClass}
            value={draft.monthlyAmount}
            onChange={(e) => setDraft((p) => ({ ...p, monthlyAmount: e.target.value }))}
            placeholder={t("profile.sideIncome.amountPh")}
          />
          <select
            className={profileInputClass}
            value={draft.type}
            onChange={(e) => setDraft((p) => ({ ...p, type: e.target.value }))}
          >
            {SIDE_INCOME_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`profile.sideIncome.type.${type}`)}
              </option>
            ))}
          </select>
          <div className="ct-row gap-2">
            <Button type="button" size="sm" onClick={saveEntry}>
              {t("common.save")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
          {t("profile.sideIncome.add")}
        </Button>
      )}
    </div>
  );
}
