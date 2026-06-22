import { useMemo, useState } from "react";
import { inputClassName, Caption, SectionLoader } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { isValidPan, maskPan, normalizePan } from "../../../utils/pan.js";
import { formatAuthError } from "../../../utils/authErrors.js";
import { normalizeIndianPhone } from "../../../utils/phone.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CitySelect } from "../../patterns/CitySelect.jsx";
import { SettingsGroup, SettingsGroupContent, SettingsGroupRow } from "./SettingsGroup.jsx";

const fieldClass = `${inputClassName()} ct-input-tint`;

/** Account sign-in & KYC — lives under Personal & money, not a top-level block. */
export default function AccountSettingsBlock() {
  const { t } = useTranslation();
  const { isReady, isLoggedIn, user, profile, signOut, saveProfile } = useAuth();
  const { settings, updateSettings } = usePerovo();
  const [username, setUsername] = useState("");
  const [pan, setPan] = useState("");
  const [showPan, setShowPan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const savedPan = useMemo(() => profile?.pan || "", [profile?.pan]);

  const handleSignOut = async () => {
    setNote("");
    setBusy(true);
    try {
      await signOut();
      setNote(t("account.signedOut"));
    } catch (e) {
      setNote(formatAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveKyc = async () => {
    setNote("");
    const normalized = normalizePan(pan);
    if (normalized && !isValidPan(normalized)) {
      setNote(t("account.panInvalid"));
      return;
    }
    setBusy(true);
    try {
      await saveProfile({
        username: username || profile?.username || settings.displayName || "",
        display_name: settings.displayName || profile?.display_name || "",
        phone: normalizeIndianPhone(settings.phoneNumber || profile?.phone || ""),
        monthly_income: Number(settings.monthlyIncome) || Number(profile?.monthly_income) || 0,
        user_mode: settings.userMode || profile?.user_mode || "salaried",
        household_scope: settings.householdScope || profile?.household_scope || "single",
        pan: normalized,
        pan_verified: false,
      });
      setPan("");
      setNote(t("account.saved"));
    } catch (e) {
      setNote(formatAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  if (!isReady) {
    return <SectionLoader message={t("account.loading")} />;
  }

  if (!isLoggedIn) {
    return (
      <SettingsGroup title={t("account.title")} icon="lock" description={t("account.signInPrompt")}>
        <SettingsGroupContent>
          <div className="ct-stat-tile">
            <p className="ct-stat-tile-label">{t("account.signInPrompt")}</p>
          </div>
        </SettingsGroupContent>
      </SettingsGroup>
    );
  }

  return (
    <SettingsGroup title={t("account.title")} icon="lock" description={t("account.subtitle")}>
      <SettingsGroupRow
        icon="envelope"
        iconColor="indigo"
        label={t("account.email")}
        value={user?.email || "—"}
      />
      <SettingsGroupRow
        icon="sign-out"
        iconColor="slate"
        label={t("account.logout")}
        onClick={handleSignOut}
        disabled={busy}
      />
      <SettingsGroupContent className="ct-stack-sm">
        <div className="ct-stack-sm">
          <label className="ct-field-label">{t("profile.userCity")}</label>
          <CitySelect
            value={settings.userCity || ""}
            onChange={(cityId) => updateSettings({ userCity: cityId })}
          />
          <Caption className="block">{t("profile.userCityHint")}</Caption>
        </div>

        <div className="ct-stack-sm">
          <label className="ct-field-label">{t("account.username")}</label>
          <input
            className={fieldClass}
            value={username || profile?.username || ""}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="ct-stack-sm">
          <label className="ct-field-label">{t("account.pan")}</label>
          <input
            className={fieldClass}
            value={showPan ? pan || savedPan : pan || maskPan(savedPan)}
            onChange={(e) => setPan(e.target.value)}
            placeholder={t("account.panPlaceholder")}
          />
          <button type="button" onClick={() => setShowPan((v) => !v)} className="ct-link !text-xs text-left">
            {showPan ? t("account.hidePan") : t("account.showPan")}
          </button>
        </div>

        <button type="button" className="ct-btn ct-btn-primary w-full" disabled={busy} onClick={handleSaveKyc}>
          {t("account.saveKyc")}
        </button>
        {note ? (
          <div className="ct-stat-tile teal">
            <p className="ct-stat-tile-label">{note}</p>
          </div>
        ) : null}
      </SettingsGroupContent>
    </SettingsGroup>
  );
}
