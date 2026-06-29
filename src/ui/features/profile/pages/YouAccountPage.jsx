import { useMemo, useState } from "react";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { isValidPan, maskPan, normalizePan } from "../../../../utils/pan.js";
import { normalizeIndianPhone } from "../../../../utils/phone.js";
import { formatAuthError } from "../../../../utils/authErrors.js";
import { CitySelect } from "../../../patterns/CitySelect.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

/** Email, city, and PAN — synced to cloud profile on save. */
export default function YouAccountPage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = usePerovo();
  const { user, profile, saveProfile } = useAuth();
  const [pan, setPan] = useState("");
  const [showPan, setShowPan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const savedPan = useMemo(() => profile?.pan || "", [profile?.pan]);
  const savedMessage = t("account.saved");

  const handleSave = async () => {
    setNote("");
    const normalized = normalizePan(pan);
    if (normalized && !isValidPan(normalized)) {
      setNote(t("account.panInvalid"));
      return;
    }
    setBusy(true);
    try {
      await saveProfile({
        username: settings.displayName || profile?.username || "",
        display_name: settings.displayName || "",
        phone: normalizeIndianPhone(settings.phoneNumber || ""),
        monthly_income: Number(settings.monthlyIncome) || 0,
        user_mode: settings.userMode || "salaried",
        household_scope: settings.householdScope || "single",
        pan: normalized,
        pan_verified: false,
      });
      setPan("");
      setNote(savedMessage);
    } catch (e) {
      setNote(formatAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <YouSubPageShell titleKey="account.title">
      <div className="ed-you-section">
        <div className="ed-ins-kicker">{t("account.title")}</div>
        <div className="ed-you-field">
          <div className="ed-you-field-label">{t("account.email")}</div>
          <div className="ed-you-readonly">{user?.email || "—"}</div>
        </div>
      </div>

      <div className="ed-you-section">
        <div className="ed-ins-kicker">{t("account.kycKicker")}</div>

        <div className="ed-you-field">
          <div className="ed-you-field-label">{t("profile.userCity")}</div>
          <CitySelect
            value={settings.userCity || ""}
            onChange={(cityId) => updateSettings({ userCity: cityId })}
            className="ed-you-input"
          />
          <div className="ed-you-field-hint">{t("profile.userCityHint")}</div>
        </div>

        <div className="ed-you-field">
          <div className="ed-you-field-label">{t("account.pan")}</div>
          <input
            className="ed-you-input"
            value={showPan ? pan || savedPan : pan || maskPan(savedPan)}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
            placeholder={t("account.panPlaceholder")}
          />
          <button type="button" className="ed-you-text-btn" onClick={() => setShowPan((v) => !v)}>
            {showPan ? t("account.hidePan") : t("account.showPan")}
          </button>
        </div>

        {note ? (
          <div className={`ed-you-note ${note === savedMessage ? "" : "error"}`}>{note}</div>
        ) : null}

        <button type="button" className="ed-you-save" disabled={busy} onClick={handleSave}>
          {busy ? t("common.saving") : t("account.saveKyc")}
        </button>
      </div>
    </YouSubPageShell>
  );
}
