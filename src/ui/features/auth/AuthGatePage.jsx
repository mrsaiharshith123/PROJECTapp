import { useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { formatAuthError } from "../../../utils/authErrors.js";
import { isValidIndianPhone, normalizeIndianPhone } from "../../../utils/phone.js";
import { isCloudSyncConfigured } from "../../../services/sync/syncEngine.js";
import { saveUserProfile } from "../../../services/supabase/auth.js";
import { markSignupPending } from "../../../utils/authSessionCleanup.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CitySelect } from "../../patterns/CitySelect.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";

const AUTH_FEATURES = [
  "auth.ed.featureBills",
  "auth.ed.featureAssets",
  "auth.ed.featureLending",
  "auth.ed.featureAi",
];

function isRecoverySession() {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash || "";
  const search = window.location.search || "";
  return hash.includes("type=recovery") || search.includes("type=recovery");
}

/**
 * @param {{
 *   label: string,
 *   value: string,
 *   onChange: (v: string) => void,
 *   show: boolean,
 *   onToggle: () => void,
 *   autoComplete?: string,
 *   placeholder?: string,
 *   t: (key: string) => string,
 * }} props
 */
function AuthPasswordField({ label, value, onChange, show, onToggle, autoComplete, placeholder, t }) {
  return (
    <div className="ed-field">
      <label className="ed-field-label">{label}</label>
      <div style={{ position: "relative" }}>
        <input
          className="ed-input"
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          style={{ paddingRight: 44 }}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "var(--ed-ink-faint)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
          }}
          aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}
        >
          <CtIcon name={show ? "eye-slash" : "eye"} size={18} />
        </button>
      </div>
    </div>
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const configured = isCloudSyncConfigured();
  const isLogin = mode === "signin";
  const isSignup = mode === "signup";

  const clearFeedback = () => {
    if (note) {
      setNote("");
      setNoteTone("neutral");
    }
    clearAuthNotice();
  };

  const switchMode = (next) => {
    setMode(next);
    setNote("");
    setNoteTone("neutral");
    clearAuthNotice();
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    if (next !== "reset") {
      setNewPassword("");
      setShowNewPassword(false);
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
    if (!email.trim()) {
      setNote(t("auth.errEmailPassword"));
      setNoteTone("danger");
      return;
    }
    if (!password.trim()) {
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

  const headline =
    mode === "forgot"
      ? t("auth.forgotTitle")
      : mode === "reset"
        ? t("auth.resetPasswordTitle")
        : isLogin
          ? t("auth.ed.welcomeBack")
          : t("auth.ed.startFree");

  const hint =
    mode === "forgot"
      ? t("auth.forgotIntro")
      : mode === "reset"
        ? t("auth.resetPasswordIntro")
        : isLogin
          ? t("auth.ed.signInHint")
          : t("auth.ed.signUpHint");

  const noteColor =
    noteTone === "success" ? "var(--ed-green)" : noteTone === "danger" ? "var(--ed-red)" : undefined;

  const feedback = note || authNotice;
  const showLoginInlineError = isLogin && Boolean(feedback);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--ed-bg)",
        display: "flex",
        flexDirection: "column",
        padding: "0 24px",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div style={{ paddingTop: 48, paddingBottom: 32, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--ed-font-serif)",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 42,
            color: "var(--ed-gold)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: 6,
          }}
        >
          {t("brand.appName")}
        </div>
        <div
          style={{
            fontFamily: "var(--ed-font-news)",
            fontStyle: "italic",
            fontSize: 14,
            color: "var(--ed-ink-faint)",
            lineHeight: 1.4,
          }}
        >
          {t("auth.ed.heroSub")}
        </div>
      </div>

      {mode !== "forgot" && mode !== "reset" ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          {AUTH_FEATURES.map((key) => (
            <span
              key={key}
              style={{
                fontFamily: "var(--ed-font)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--ed-ink-faint)",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "var(--ed-gold)",
                  display: "inline-block",
                }}
              />
              {t(key)}
            </span>
          ))}
        </div>
      ) : null}

      <div
        style={{
          background: "var(--ed-surface)",
          border: "0.5px solid var(--ed-rule)",
          borderRadius: "var(--ed-r-xl)",
          padding: "24px 20px",
          flex: 1,
          maxHeight: mode === "signup" ? 560 : 480,
          overflowY: "auto",
        }}
      >
        {mode !== "forgot" && mode !== "reset" && (
          <div
            style={{
              display: "flex",
              background: "var(--ed-surface-3)",
              borderRadius: "var(--ed-r-md)",
              padding: 3,
              marginBottom: 22,
              gap: 3,
            }}
          >
            {[["signin", t("auth.login")], ["signup", t("auth.createAccount")]].map(([id, label]) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchMode(id)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: "var(--ed-r-sm)",
                    border: "none",
                    background: active ? "var(--ed-gold)" : "transparent",
                    color: active ? "#16140f" : "var(--ed-ink-faint)",
                    fontFamily: "var(--ed-font)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div
          style={{
            fontFamily: "var(--ed-font-serif)",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 20,
            color: "var(--ed-ink)",
            marginBottom: 4,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontFamily: "var(--ed-font-news)",
            fontStyle: "italic",
            fontSize: 12,
            color: "var(--ed-ink-faint)",
            marginBottom: 20,
            lineHeight: 1.45,
          }}
        >
          {hint}
        </div>

        {mode !== "reset" && (
          <div className="ed-field">
            <label className="ed-field-label">{t("auth.email")}</label>
            <input
              className="ed-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t("auth.ed.emailPlaceholder")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFeedback();
              }}
            />
          </div>
        )}

        {isLogin && (
          <>
            <AuthPasswordField
              label={t("auth.password")}
              value={password}
              onChange={(v) => {
                setPassword(v);
                clearFeedback();
              }}
              show={showPassword}
              onToggle={() => setShowPassword((p) => !p)}
              autoComplete="current-password"
              placeholder={t("auth.ed.passwordPlaceholder")}
              t={t}
            />
            <div
              className="ed-row"
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginTop: -4,
                marginBottom: 8,
                minHeight: 20,
              }}
            >
              {showLoginInlineError ? (
                <span
                  className="ed-field-error"
                  style={{
                    margin: 0,
                    flex: 1,
                    minWidth: 0,
                    fontSize: 11,
                    lineHeight: 1.35,
                    color: noteColor || "var(--ed-red)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 4,
                  }}
                >
                  <span style={{ flexShrink: 0, marginTop: 1 }} aria-hidden>
                    <CtIcon name="warning" size={12} />
                  </span>
                  <span>{feedback}</span>
                </span>
              ) : (
                <span aria-hidden />
              )}
              <button
                type="button"
                className="ed-btn-link"
                style={{
                  flexShrink: 0,
                  fontSize: 12,
                  color: "var(--ed-gold)",
                  whiteSpace: "nowrap",
                }}
                onClick={() => switchMode("forgot")}
              >
                {t("auth.forgotPassword")}
              </button>
            </div>
          </>
        )}

        {isSignup && (
          <>
            <AuthPasswordField
              label={t("auth.password")}
              value={password}
              onChange={(v) => {
                setPassword(v);
                clearFeedback();
              }}
              show={showPassword}
              onToggle={() => setShowPassword((p) => !p)}
              autoComplete="new-password"
              placeholder={t("auth.ed.passwordCreatePlaceholder")}
              t={t}
            />
            <AuthPasswordField
              label={t("auth.confirmPassword")}
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                clearFeedback();
              }}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((p) => !p)}
              autoComplete="new-password"
              placeholder={t("auth.ed.passwordCreatePlaceholder")}
              t={t}
            />
            <div className="ed-field">
              <label className="ed-field-label">{t("auth.yourName")}</label>
              <input
                className="ed-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFeedback();
                }}
              />
            </div>
            <div className="ed-field">
              <label className="ed-field-label">{t("auth.mobile")}</label>
              <input
                type="tel"
                className="ed-input"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearFeedback();
                }}
                placeholder={t("auth.mobilePlaceholder")}
                inputMode="numeric"
              />
            </div>
            <div className="ed-field">
              <label className="ed-field-label">{t("auth.monthlySalary")}</label>
              <input
                type="number"
                min="1"
                className="ed-input"
                value={income}
                onChange={(e) => {
                  setIncome(e.target.value);
                  clearFeedback();
                }}
              />
            </div>
            <div className="ed-field">
              <label className="ed-field-label">{t("profile.userCity")}</label>
              <CitySelect
                value={userCity}
                onChange={(v) => {
                  setUserCity(v);
                  clearFeedback();
                }}
              />
            </div>
          </>
        )}

        {mode === "reset" && (
          <>
            <AuthPasswordField
              label={t("auth.newPassword")}
              value={newPassword}
              onChange={(v) => {
                setNewPassword(v);
                clearFeedback();
              }}
              show={showNewPassword}
              onToggle={() => setShowNewPassword((p) => !p)}
              autoComplete="new-password"
              placeholder={t("auth.ed.passwordCreatePlaceholder")}
              t={t}
            />
            <AuthPasswordField
              label={t("auth.confirmPassword")}
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                clearFeedback();
              }}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((p) => !p)}
              autoComplete="new-password"
              placeholder={t("auth.ed.passwordCreatePlaceholder")}
              t={t}
            />
          </>
        )}

        {feedback && !showLoginInlineError && (
          <div className="ed-field-error" style={{ marginBottom: 14, color: noteColor }}>
            {feedback}
          </div>
        )}

        {mode === "forgot" ? (
          <button type="button" className="ed-btn ed-btn-primary ed-btn-block" disabled={busy} onClick={handleForgot}>
            {busy ? t("auth.pleaseWait") : t("auth.sendResetLink")}
          </button>
        ) : mode === "reset" ? (
          <button
            type="button"
            className="ed-btn ed-btn-primary ed-btn-block"
            disabled={busy}
            onClick={handleResetPassword}
          >
            {busy ? t("auth.pleaseWait") : t("auth.updatePassword")}
          </button>
        ) : (
          <button
            type="button"
            className="ed-btn ed-btn-primary ed-btn-block"
            disabled={busy}
            onClick={handleSubmit}
            style={{ marginTop: 4 }}
          >
            {busy ? t("auth.pleaseWait") : isLogin ? t("auth.login") : t("auth.createAccount")}
          </button>
        )}

        {(mode === "forgot" || mode === "reset") && (
          <button
            type="button"
            className="ed-btn-link"
            style={{
              display: "block",
              textAlign: "center",
              width: "100%",
              marginTop: 14,
              fontSize: 12,
              color: "var(--ed-gold)",
            }}
            onClick={() => switchMode("signin")}
          >
            {t("auth.backToSignIn")}
          </button>
        )}
      </div>

      <div
        style={{
          textAlign: "center",
          padding: "20px 0",
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
        }}
      >
        <div
          style={{
            fontFamily: "var(--ed-font-news)",
            fontStyle: "italic",
            fontSize: 11,
            color: "var(--ed-ink-faint)",
            lineHeight: 1.5,
          }}
        >
          {t("auth.ed.footerNote")}
        </div>
      </div>
    </div>
  );
}
