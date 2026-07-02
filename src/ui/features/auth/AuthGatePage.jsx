import { useState } from "react";
import { Card, Button, inputClassName, FormField, Caption, Heading, Body, PasswordInput } from "../../index.js";
import { PerovoBrand } from "../../brand/PerovoBrand.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { formatAuthError } from "../../../utils/authErrors.js";
import { isValidIndianPhone, normalizeIndianPhone } from "../../../utils/phone.js";
import { isCloudSyncConfigured } from "../../../services/sync/syncEngine.js";
import { saveUserProfile } from "../../../services/supabase/auth.js";
import { markSignupPending } from "../../../utils/authSessionCleanup.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CitySelect } from "../../patterns/CitySelect.jsx";

const fieldClass = `${inputClassName()} ct-input-tint`;

function isRecoverySession() {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash || "";
  const search = window.location.search || "";
  return hash.includes("type=recovery") || search.includes("type=recovery");
}

function AuthAmbient() {
  return (
    <div className="ct-auth-ambient" aria-hidden>
      <div className="ct-auth-grid" />
      <div className="ct-auth-orb ct-auth-orb-a" />
      <div className="ct-auth-orb ct-auth-orb-b" />
      <div className="ct-auth-orb ct-auth-orb-c" />
      <div className="ct-auth-shine" />
    </div>
  );
}

function AuthBrandHero() {
  return (
    <header className="ct-auth-hero">
      <div className="ct-auth-logo-tile" aria-hidden>
        <PerovoBrand layout="column" iconSize="lg" wordmarkSize="lg" className="ct-auth-brand-lockup" />
      </div>
    </header>
  );
}

export default function AuthGatePage() {
  const { t } = useTranslation();
  const { signIn, signUp, resetPassword, updatePassword, authNotice, clearAuthNotice } = useAuth();
  const { updateSettings } = usePerovo();
  const [mode, setMode] = useState(() => (isRecoverySession() ? "reset" : "signin"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [income, setIncome] = useState("");
  const [userCity, setUserCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [noteTone, setNoteTone] = useState("neutral");

  const configured = isCloudSyncConfigured();

  const switchMode = (next) => {
    setMode(next);
    setNote("");
    setNoteTone("neutral");
    clearAuthNotice();
    setConfirmPassword("");
    if (next !== "reset") {
      setNewPassword("");
    }
  };

  const validateSignup = () => {
    if (!email.trim() || !password) return t("auth.errEmailPassword");
    if (password.length < 6) return t("auth.errPasswordLength");
    if (password !== confirmPassword) return t("auth.passwordMismatch");
    if (!name.trim()) return t("auth.errNameRequired");
    if (!isValidIndianPhone(phone)) return t("auth.errPhoneInvalid");
    const incomeNum = Number(income);
    if (!income || incomeNum <= 0) return t("auth.errSalaryRequired");
    if (!userCity) return t("auth.errCityRequired");
    return null;
  };

  const applySignupLocal = (incomeNum) => {
    const displayName = name.trim();
    const phoneNorm = normalizeIndianPhone(phone);
    updateSettings({
      displayName,
      phoneNumber: phoneNorm,
      monthlyIncome: incomeNum,
      userMode: "salaried",
      userCity,
      onboardingComplete: false,
    });
  };

  const persistSignupProfile = async (userId, incomeNum) => {
    const displayName = name.trim();
    const phoneNorm = normalizeIndianPhone(phone);
    await saveUserProfile(userId, {
      username: displayName,
      display_name: displayName,
      phone: phoneNorm,
      user_mode: "salaried",
      monthly_income: incomeNum,
      onboarding_complete: false,
    });
  };

  const handleForgot = async () => {
    setNote("");
    clearAuthNotice();
    if (!configured) {
      setNote(t("auth.errNotConfigured"));
      setNoteTone("danger");
      return;
    }
    if (!email.trim()) {
      setNote(t("auth.errEmailPassword"));
      setNoteTone("danger");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setNote(t("auth.resetSent"));
      setNoteTone("success");
    } catch (e) {
      setNote(formatAuthError(e));
      setNoteTone("danger");
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    setNote("");
    clearAuthNotice();
    if (newPassword.length < 6) {
      setNote(t("auth.errPasswordLength"));
      setNoteTone("danger");
      return;
    }
    if (newPassword !== confirmPassword) {
      setNote(t("auth.passwordMismatch"));
      setNoteTone("danger");
      return;
    }
    setBusy(true);
    try {
      await updatePassword(newPassword);
      setNote(t("auth.passwordUpdated"));
      setNoteTone("success");
      if (typeof window !== "undefined" && window.history.replaceState) {
        const clean = window.location.pathname + window.location.search.replace(/[?&]type=recovery/, "");
        window.history.replaceState({}, "", clean);
      }
      setTimeout(() => switchMode("signin"), 1200);
    } catch (e) {
      setNote(formatAuthError(e));
      setNoteTone("danger");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    setNote("");
    clearAuthNotice();
    if (!configured) {
      setNote(t("auth.errNotConfigured"));
      setNoteTone("danger");
      return;
    }
    if (!email.trim() || !password) {
      setNote(t("auth.errEmailPassword"));
      setNoteTone("danger");
      return;
    }
    if (mode === "signup") {
      const err = validateSignup();
      if (err) {
        setNote(err);
        setNoteTone("danger");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
        setNote(t("auth.signedIn"));
        setNoteTone("success");
      } else {
        const incomeNum = Math.max(0, Number(income) || 0);
        const result = /** @type {{ user?: { id?: string }, session?: unknown } | null | undefined} */ (
          await signUp(email.trim(), password, {
            display_name: name.trim(),
            phone: normalizeIndianPhone(phone),
            monthly_income: incomeNum,
            user_mode: "salaried",
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
          setNoteTone("success");
        } else if (uid) {
          setNote(t("auth.accountCreatedConfirm"));
          setNoteTone("success");
        } else {
          setNote(t("auth.checkEmail"));
          setNoteTone("success");
        }
      }
    } catch (e) {
      setNote(formatAuthError(e));
      setNoteTone("danger");
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "forgot"
      ? t("auth.forgotTitle")
      : mode === "reset"
        ? t("auth.resetPasswordTitle")
        : mode === "signin"
          ? t("auth.signInTitle")
          : t("auth.signUpTitle");

  const subtitle =
    mode === "forgot"
      ? t("auth.forgotIntro")
      : mode === "reset"
        ? t("auth.resetPasswordIntro")
        : t("auth.intro");

  return (
    <div className="ct-auth-scene">
      <AuthAmbient />
      <div className="ct-auth-content">
        <AuthBrandHero />

        <Card className="ct-auth-card ct-stack">
          <div>
            <Heading level={2} className="ct-auth-card-title">
              {title}
            </Heading>
            <Body className="!text-sm mt-1.5 opacity-90">{subtitle}</Body>
          </div>

          {mode !== "forgot" && mode !== "reset" && (
            <div className="ct-row gap-2">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`ct-chip flex-1 ${mode === "signin" ? "ct-chip-active" : ""}`}
              >
                {t("auth.login")}
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`ct-chip flex-1 ${mode === "signup" ? "ct-chip-active" : ""}`}
              >
                {t("auth.createAccount")}
              </button>
            </div>
          )}

          {mode !== "reset" && (
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
          )}

          {mode === "signin" && (
            <>
              <FormField label={t("auth.password")}>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  minLength={6}
                  className={fieldClass}
                />
              </FormField>
              <div className="ct-row-between -mt-1">
                <span />
                <button type="button" className="ct-link !text-xs" onClick={() => switchMode("forgot")}>
                  {t("auth.forgotPassword")}
                </button>
              </div>
            </>
          )}

          {mode === "signup" && (
            <>
              <FormField label={t("auth.password")}>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className={fieldClass}
                />
              </FormField>
              <FormField label={t("auth.confirmPassword")}>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className={fieldClass}
                />
              </FormField>
              <FormField label={t("auth.yourName")}>
                <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} required />
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
              <FormField label={t("profile.userCity")}>
                <CitySelect value={userCity} onChange={setUserCity} required />
              </FormField>
            </>
          )}

          {mode === "reset" && (
            <>
              <FormField label={t("auth.newPassword")}>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className={fieldClass}
                />
              </FormField>
              <FormField label={t("auth.confirmPassword")}>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className={fieldClass}
                />
              </FormField>
            </>
          )}

          {mode === "forgot" ? (
            <Button type="button" disabled={busy} onClick={handleForgot} size="lg" variant="primary">
              {busy ? t("auth.pleaseWait") : t("auth.sendResetLink")}
            </Button>
          ) : mode === "reset" ? (
            <Button type="button" disabled={busy} onClick={handleResetPassword} size="lg" variant="primary">
              {busy ? t("auth.pleaseWait") : t("auth.updatePassword")}
            </Button>
          ) : (
            <Button type="button" disabled={busy} onClick={handleSubmit} size="lg" variant="primary">
              {busy ? t("auth.pleaseWait") : mode === "signin" ? t("auth.login") : t("auth.createAndContinue")}
            </Button>
          )}

          {(mode === "forgot" || mode === "reset") && (
            <button type="button" className="ct-link !text-sm text-center" onClick={() => switchMode("signin")}>
              {t("auth.backToSignIn")}
            </button>
          )}

          {authNotice && <Caption className="block text-[var(--ct-warning)]">{authNotice}</Caption>}
          {note && (
            <Caption
              className={`block ${noteTone === "success" ? "text-[var(--ct-success)]" : noteTone === "danger" ? "text-[var(--ct-danger)]" : ""}`}
            >
              {note}
            </Caption>
          )}
        </Card>

      </div>
    </div>
  );
}
