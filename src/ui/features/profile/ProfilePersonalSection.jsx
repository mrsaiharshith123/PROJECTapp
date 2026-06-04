import { Card, Caption, Heading, inputClassName } from "../../index.js";
import ProfileManager from "./ProfileManager.jsx";
import AccountSettingsBlock from "./AccountSettingsBlock.jsx";
import ProfileAvatar from "./ProfileAvatar.jsx";
import { isSalariedFamily, getIncomeLabel, resolveUserMode } from "../../../constants/modeExperience.js";
import { SELECTABLE_USER_MODES, getUserModeConfig } from "../../../constants/userModes.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { applyColorScheme } from "../../../utils/theme.js";

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
  const salariedFamily = isSalariedFamily(settings);
  const incomeLabel = getIncomeLabel(settings);
  const modeCfg = getUserModeConfig(resolveUserMode(settings));
  const userMode = resolveUserMode(settings);

  return (
    <Card className="ct-stack">
      <div>
        <Heading level={3}>About you</Heading>
        <Caption className="block mt-1">Name, look & feel, and how we label your experience.</Caption>
      </div>

      <ProfileAvatar settings={settings} updateSettings={updateSettings} />

      <ProfileField label="Display name" hint="How we greet you on the dashboard.">
        <input
          className={profileInputClass}
          value={settings.displayName ?? ""}
          onChange={(e) => updateSettings({ displayName: e.target.value })}
          placeholder="Your name"
        />
      </ProfileField>

      <ProfileField label="Mobile number" hint="10-digit Indian mobile linked to your account.">
        <input
          type="tel"
          className={profileInputClass}
          value={settings.phoneNumber ?? ""}
          onChange={(e) => updateSettings({ phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 12) })}
          placeholder="9876543210"
          inputMode="numeric"
        />
      </ProfileField>

      <ProfileField label="Appearance">
        <div className="ct-grid-3">
          {[
            { id: "light", label: "Light" },
            { id: "dark", label: "Dark" },
            { id: "system", label: "System" },
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
              <span className="text-xs font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>
      </ProfileField>

      {salariedFamily && (
        <div className="ct-stack-sm pt-2 border-t border-[var(--ct-border)]">
          <Caption className="font-semibold block">Family profiles</Caption>
          <Caption className="block">Separate bills by family member or area of the home.</Caption>
          <ProfileManager />
        </div>
      )}

      <div className="ct-stack pt-2 border-t border-[var(--ct-border)]">
        <div>
          <Heading level={3}>Money setup</Heading>
          <Caption className="block mt-1">Income and mode drive pressure scores, tools, and reminders.</Caption>
        </div>

        <ProfileField label={`${incomeLabel} (₹)`} required hint="Used across analytics and tools.">
          <input
            type="number"
            min="0"
            className={profileInputClass}
            value={settings.monthlyIncome === 0 ? "" : String(settings.monthlyIncome)}
            onChange={(e) => {
              const raw = e.target.value;
              updateSettings({ monthlyIncome: raw === "" ? 0 : Math.max(0, Number(raw) || 0) });
            }}
            placeholder="e.g. 75000"
          />
        </ProfileField>

        {userMode === "salaried" && (
          <ProfileField
            label="Second income (₹/mo)"
            hint="Partner salary or steady side income — combined with main income for pressure, forecasts, and reminders. Use 0 if none."
          >
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
          <ProfileField label="Income you enter is" hint={CALC_HELP.incomeEntryBasis}>
            <select
              className={profileInputClass}
              value={settings.incomeEntryBasis === "gross" ? "gross" : "take_home"}
              onChange={(e) => updateSettings({ incomeEntryBasis: e.target.value === "gross" ? "gross" : "take_home" })}
            >
              <option value="take_home">Take-home (after tax / PF) — recommended</option>
              <option value="gross">Gross / CTC-style (before deductions)</option>
            </select>
          </ProfileField>
        )}

        <ProfileField label="Liquid savings (₹)" hint="Cash you can access quickly — emergency & survival math.">
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

        <ProfileField label="User mode" hint={modeCfg.description}>
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
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
        </ProfileField>

        {userMode === "salaried" && (
          <ProfileField
            label="Household"
            hint="Family unlocks household categories, payer tags, and family member profiles."
          >
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
              <option value="single">Just me</option>
              <option value="family">Family household</option>
            </select>
          </ProfileField>
        )}

        {settings.householdScope === "family" && (
          <ProfileField label="Dependents" hint="People relying on household income.">
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
