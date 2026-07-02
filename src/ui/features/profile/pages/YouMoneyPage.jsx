import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { resolveUserMode, getIncomeLabelKey } from "../../../../constants/modeExperience.js";
import { CALC_HELP } from "../../../../constants/calculationHelp.js";
import YouSubPageShell from "./YouSubPageShell.jsx";

/** Income and paycheck rhythm. */
export default function YouMoneyPage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = usePerovo();
  const userMode = resolveUserMode(settings);
  const incomeLabel = t(getIncomeLabelKey(settings));

  return (
    <YouSubPageShell titleKey="profile.moneySetup.title">
      <div className="ed-you-section">
        <div className="ed-ins-kicker">{t("profile.moneySetup.title")}</div>

        <div className="ed-you-field">
          <div className="ed-you-field-label">
            {incomeLabel} (₹)
          </div>
          <input
            className="ed-you-input"
            type="number"
            min="0"
            inputMode="numeric"
            value={settings.monthlyIncome === 0 ? "" : String(settings.monthlyIncome)}
            onChange={(e) => {
              const raw = e.target.value;
              updateSettings({ monthlyIncome: raw === "" ? 0 : Math.max(0, Number(raw) || 0) });
            }}
            placeholder={t("profile.incomePlaceholder")}
          />
          <div className="ed-you-field-hint">{t("profile.incomeUsedHint")}</div>
        </div>
      </div>

      {userMode === "salaried" ? (
        <div className="ed-you-section">
          <div className="ed-ins-kicker">{t("profile.paycheckKicker")}</div>

          <div className="ed-you-field">
            <div className="ed-you-field-label">{t("profile.incomeBasis")}</div>
            <div className="ed-option-row">
              {[
                { id: "take_home", label: t("profile.incomeTakeHomeShort") },
                { id: "gross", label: t("profile.incomeGrossShort") },
              ].map((opt) => {
                const active = (settings.incomeEntryBasis || "take_home") === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`ed-option-btn ${active ? "active" : ""}`}
                    onClick={() => updateSettings({ incomeEntryBasis: opt.id })}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="ed-you-field-hint">{t(CALC_HELP.incomeEntryBasis)}</div>
          </div>

          <div className="ed-you-field">
            <div className="ed-you-field-label">{t("profile.salaryCreditDay")}</div>
            <input
              className="ed-you-input"
              type="number"
              min="1"
              max="31"
              inputMode="numeric"
              value={settings.salaryCreditDay == null ? "" : String(settings.salaryCreditDay)}
              onChange={(e) => {
                const raw = e.target.value;
                updateSettings({
                  salaryCreditDay:
                    raw === "" ? null : Math.min(31, Math.max(1, Math.floor(Number(raw) || 1))),
                });
              }}
              placeholder="1"
            />
            <div className="ed-you-field-hint">{t("profile.salaryCreditDayHint")}</div>
          </div>
        </div>
      ) : null}
    </YouSubPageShell>
  );
}
