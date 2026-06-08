import { useState } from "react";
import { Card, Button, inputClassName, FormField, Caption, Heading, Body, Eyebrow } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { formatAuthError } from "../../../utils/authErrors.js";
import { isValidIndianPhone, normalizeIndianPhone } from "../../../utils/phone.js";
import { isCloudSyncConfigured } from "../../../services/sync/syncEngine.js";
import { saveUserProfile } from "../../../services/supabase/auth.js";
import { markSignupPending } from "../../../utils/authSessionCleanup.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

const fieldClass = inputClassName();

export default function AuthGatePage() {
  const { t } = useTranslation();
  const { signIn, signUp, authNotice, clearAuthNotice } = useAuth();
  const { updateSettings } = useCommitTrack();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [income, setIncome] = useState("");
  const [householdScope, setHouseholdScope] = useState("single");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const configured = isCloudSyncConfigured();

  const validateSignup = () => {
    if (!email.trim() || !password) return t("auth.errEmailPassword");
    if (password.length < 6) return t("auth.errPasswordLength");
    if (!name.trim()) return t("auth.errNameRequired");
    if (!isValidIndianPhone(phone)) return t("auth.errPhoneInvalid");
    const incomeNum = Number(income);
    if (!income || incomeNum <= 0) return t("auth.errSalaryRequired");
    return null;
  };

  const applySignupLocal = (incomeNum) => {
    const displayName = name.trim();
    const phoneNorm = normalizeIndianPhone(phone);
    const scope = householdScope === "family" ? "family" : "single";
    updateSettings({
      displayName,
      phoneNumber: phoneNorm,
      monthlyIncome: incomeNum,
      userMode: "salaried",
      householdScope: scope,
      onboardingComplete: false,
    });
  };

  const persistSignupProfile = async (userId, incomeNum) => {
    const displayName = name.trim();
    const phoneNorm = normalizeIndianPhone(phone);
    const scope = householdScope === "family" ? "family" : "single";
    await saveUserProfile(userId, {
      username: displayName,
      display_name: displayName,
      phone: phoneNorm,
      user_mode: "salaried",
      household_scope: scope,
      monthly_income: incomeNum,
      onboarding_complete: false,
    });
  };

  const handleSubmit = async () => {
    setNote("");
    clearAuthNotice();
    if (!configured) {
      setNote(t("auth.errNotConfigured"));
      return;
    }
    if (!email.trim() || !password) {
      setNote(t("auth.errEmailPassword"));
      return;
    }
    if (mode === "signup") {
      const err = validateSignup();
      if (err) {
        setNote(err);
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
        setNote(t("auth.signedIn"));
      } else {
        const incomeNum = Math.max(0, Number(income) || 0);
        const result = /** @type {{ user?: { id?: string }, session?: unknown } | null | undefined} */ (
          await signUp(email.trim(), password, {
            display_name: name.trim(),
            phone: normalizeIndianPhone(phone),
            monthly_income: incomeNum,
            user_mode: "salaried",
            household_scope: householdScope === "family" ? "family" : "single",
            onboarding_complete: false,
          })
        );
        applySignupLocal(incomeNum);
        markSignupPending();
        const uid = result?.user?.id;
        const hasSession = Boolean(result?.session);
        if (uid && hasSession) {
          let signupNote = t("auth.accountCreated");
          try {
            await persistSignupProfile(uid, incomeNum);
          } catch (profileErr) {
            const msg = formatAuthError(profileErr);
            if (msg.includes("Confirm your email") || msg.includes("migrations")) {
              signupNote = `${t("auth.accountCreated")} (${msg})`;
            } else {
              throw profileErr;
            }
          }
          setNote(signupNote);
        } else if (uid) {
          setNote(t("auth.accountCreatedConfirm"));
        } else {
          setNote(t("auth.checkEmail"));
        }
      }
    } catch (e) {
      setNote(formatAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ct-onboard-page">
      <div>
        <Eyebrow>CommitTrack</Eyebrow>
        <Heading level={2} className="ct-onboard-title">
          {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
        </Heading>
        <Body className="!text-sm mt-2">{t("auth.intro")}</Body>
      </div>

      <Card className="ct-stack">
        <div className="ct-row gap-2">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`ct-chip flex-1 ${mode === "signin" ? "ct-chip-active" : ""}`}
          >
            {t("auth.login")}
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`ct-chip flex-1 ${mode === "signup" ? "ct-chip-active" : ""}`}
          >
            {t("auth.createAccount")}
          </button>
        </div>

        <FormField label={t("auth.email")}>
          <input
            type="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </FormField>
        <FormField label={t("auth.password")}>
          <input
            type="password"
            className={fieldClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
          />
        </FormField>

        {mode === "signup" && (
          <>
            <FormField label={t("auth.yourName")}>
              <input
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>
            <FormField label={t("auth.mobile")}>
              <input
                type="tel"
                className={fieldClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("auth.mobilePlaceholder")}
                inputMode="numeric"
                required
              />
            </FormField>
            <FormField label={t("auth.monthlySalary")}>
              <input
                type="number"
                min="1"
                className={fieldClass}
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                required
              />
            </FormField>
            <FormField label={t("auth.household")}>
              <select
                className={fieldClass}
                value={householdScope}
                onChange={(e) => setHouseholdScope(e.target.value)}
              >
                <option value="single">{t("auth.householdSingle")}</option>
                <option value="family">{t("auth.householdFamily")}</option>
              </select>
            </FormField>
          </>
        )}

        <Button type="button" disabled={busy} onClick={handleSubmit} size="lg" variant="primary">
          {busy ? t("auth.pleaseWait") : mode === "signin" ? t("auth.login") : t("auth.createAndContinue")}
        </Button>
        {authNotice && <Caption className="block text-[var(--ct-warning)]">{authNotice}</Caption>}
        {note && <Caption className="block">{note}</Caption>}
      </Card>
    </div>
  );
}
