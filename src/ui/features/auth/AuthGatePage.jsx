import { useState } from "react";
import { Card, Button, inputClassName, FormField, Caption, Heading, Body, Eyebrow } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { formatAuthError } from "../../../utils/authErrors.js";
import { isValidIndianPhone, normalizeIndianPhone } from "../../../utils/phone.js";
import { isCloudSyncConfigured } from "../../../services/sync/syncEngine.js";
import { saveUserProfile } from "../../../services/supabase/auth.js";
import { markSignupPending } from "../../../utils/authSessionCleanup.js";

const inputClass = inputClassName();

export default function AuthGatePage() {
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
    if (!email.trim() || !password) return "Email and password are required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!name.trim()) return "Your name is required.";
    if (!isValidIndianPhone(phone)) return "Enter a valid 10-digit mobile number.";
    const incomeNum = Number(income);
    if (!income || incomeNum <= 0) return "Monthly salary is required.";
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
      setNote("Sign-in is not available — Supabase URL and anon key must be set in .env.");
      return;
    }
    if (!email.trim() || !password) {
      setNote("Email and password are required.");
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
        setNote("Signed in.");
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
          let signupNote = "Account created — finish setup on the next screens.";
          try {
            await persistSignupProfile(uid, incomeNum);
          } catch (profileErr) {
            const msg = formatAuthError(profileErr);
            if (msg.includes("Confirm your email") || msg.includes("migrations")) {
              signupNote =
                "Account created — finish setup on the next screens. (Profile sync: " + msg + ")";
            } else {
              throw profileErr;
            }
          }
          setNote(signupNote);
        } else if (uid) {
          setNote(
            "Account created. Confirm your email if Supabase asks, then sign in to finish setup.",
          );
        } else {
          setNote("Check your email to confirm, then sign in to continue setup.");
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
          {mode === "signin" ? "Sign in to continue" : "Create your account"}
        </Heading>
        <Body className="!text-sm mt-2">
          An account is required. Your data stays linked to your sign-in; bills and EMIs can be added
          later.
        </Body>
      </div>

      <Card className="ct-stack">
        <div className="ct-row gap-2">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`ct-chip flex-1 ${mode === "signin" ? "ct-chip-active" : ""}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`ct-chip flex-1 ${mode === "signup" ? "ct-chip-active" : ""}`}
          >
            Create account
          </button>
        </div>

        <FormField label="Email *">
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </FormField>
        <FormField label="Password *">
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
          />
        </FormField>

        {mode === "signup" && (
          <>
            <FormField label="Your name *">
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Mobile number *">
              <input
                type="tel"
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit Indian mobile"
                inputMode="numeric"
                required
              />
            </FormField>
            <FormField label="Monthly salary (₹) *">
              <input
                type="number"
                min="1"
                className={inputClass}
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Household *">
              <select
                className={inputClass}
                value={householdScope}
                onChange={(e) => setHouseholdScope(e.target.value)}
              >
                <option value="single">Just me</option>
                <option value="family">Family household</option>
              </select>
            </FormField>
          </>
        )}

        <Button type="button" disabled={busy} onClick={handleSubmit} size="lg" variant="primary">
          {busy ? "Please wait…" : mode === "signin" ? "Login" : "Create account & continue"}
        </Button>
        {authNotice && <Caption className="block text-[var(--ct-warning)]">{authNotice}</Caption>}
        {note && <Caption className="block">{note}</Caption>}
      </Card>
    </div>
  );
}
