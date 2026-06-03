import { Card } from "../../../ui";
import { SELECTABLE_USER_MODES, getUserModeConfig } from "../../../constants/userModes.js";
import { getIncomeLabel, resolveUserMode } from "../../../constants/modeExperience.js";
import { ProfileField, profileInputClass } from "./ProfileField.jsx";
import { CALC_HELP } from "../../../constants/calculationHelp.js";

export default function ProfileMoneySection({ settings, updateSettings }) {
  const incomeLabel = getIncomeLabel(settings);
  const modeCfg = getUserModeConfig(resolveUserMode(settings));
  const userMode = resolveUserMode(settings);

  return (
    <Card className="space-y-4">
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
      {["salaried", "freelancer"].includes(userMode) && (
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
      <ProfileField label="Dependents" hint="People relying on your income (family household).">
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
            onChange={(e) =>
              updateSettings({
                householdScope: e.target.value === "family" ? "family" : "single",
                activeProfileId: e.target.value === "family" ? settings.activeProfileId : "default",
              })
            }
          >
            <option value="single">Just me</option>
            <option value="family">Family household</option>
          </select>
        </ProfileField>
      )}
    </Card>
  );
}
