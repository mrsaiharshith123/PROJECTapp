import { useMemo, useState } from "react";
import { Card, Button, inputClassName, FormField, Body, Caption, Heading } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { isValidPan, maskPan, normalizePan } from "../../../utils/pan.js";
import { SELECTABLE_USER_MODES } from "../../../constants/userModes.js";
import AccountActivityLog from "./AccountActivityLog.jsx";

const inputClass = inputClassName();

export default function AccountPanel() {
  const {
    isReady,
    isLoggedIn,
    user,
    profile,
    error,
    activity,
    signIn,
    signUp,
    signOut,
    saveProfile,
    clearActivity,
    refreshActivity,
  } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [pan, setPan] = useState("");
  const [showPan, setShowPan] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupMode, setSignupMode] = useState("salaried");
  const [signupHouseholdScope, setSignupHouseholdScope] = useState("single");
  const [signupIncome, setSignupIncome] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");

  const savedPan = useMemo(() => profile?.pan || "", [profile?.pan]);
  const displayError = localError || error;

  const handleAuth = async () => {
    setLocalError("");
    setNote("");
    if (!email || !password) {
      setLocalError("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        setNote("Signed in successfully.");
      } else {
        await signUp(email, password, {
          display_name: signupName.trim(),
          user_mode: signupMode,
          household_scope: signupMode === "salaried" ? signupHouseholdScope : "single",
          monthly_income: Math.max(0, Number(signupIncome) || 0),
          onboarding_complete: true,
        });
        setNote("Account created. Confirm your email if your project requires it.");
      }
      refreshActivity();
    } catch (e) {
      setLocalError((e instanceof Error ? e.message : null) || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveKyc = async () => {
    setLocalError("");
    setNote("");
    const normalized = normalizePan(pan);
    if (normalized && !isValidPan(normalized)) {
      setLocalError("PAN format should be like ABCDE1234F.");
      return;
    }
    setBusy(true);
    try {
      await saveProfile({
        username: username || profile?.username || "",
        pan: normalized,
        pan_verified: false,
      });
      setPan("");
      setNote("Account profile saved.");
      refreshActivity();
    } catch (e) {
      setLocalError((e instanceof Error ? e.message : null) || "Could not save account profile.");
    } finally {
      setBusy(false);
    }
  };

  if (!isReady) {
    return (
      <Card className="ct-stack">
        <Heading level={3}>Account</Heading>
        <Caption className="block">Loading account…</Caption>
      </Card>
    );
  }

  if (!isLoggedIn) {
    return (
      <Card className="ct-stack">
        <div className="ct-row-between">
          <Heading level={3}>Account</Heading>
          <div className="ct-row gap-2">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`ct-chip ${mode === "signin" ? "ct-chip-active" : ""}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`ct-chip ${mode === "signup" ? "ct-chip-active" : ""}`}
            >
              Create
            </button>
          </div>
        </div>
        <Caption className="block">
          Optional — local data works without an account. Sign in for cloud backup and multi-device sync.
        </Caption>
        <input
          type="email"
          className={inputClass}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          type="password"
          className={inputClass}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />
        {mode === "signup" && (
          <>
            <FormField label="Your name">
              <input
                className={inputClass}
                placeholder="Your name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
              />
            </FormField>
            <FormField label="How you earn">
              <select className={inputClass} value={signupMode} onChange={(e) => setSignupMode(e.target.value)}>
                {SELECTABLE_USER_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </FormField>
            {signupMode === "salaried" && (
              <FormField label="Household">
                <select
                  className={inputClass}
                  value={signupHouseholdScope}
                  onChange={(e) => setSignupHouseholdScope(e.target.value)}
                >
                  <option value="single">Single</option>
                  <option value="family">Family</option>
                </select>
              </FormField>
            )}
            <FormField label="Monthly income (₹)">
              <input
                type="number"
                min="0"
                className={inputClass}
                placeholder="Monthly income"
                value={signupIncome}
                onChange={(e) => setSignupIncome(e.target.value)}
              />
            </FormField>
          </>
        )}
        <Button type="button" disabled={busy} onClick={handleAuth} size="lg">
          {busy ? "Please wait…" : mode === "signin" ? "Login" : "Create account"}
        </Button>
        {displayError && <Caption className="block text-[var(--ct-danger)]">{displayError}</Caption>}
        {note && <Caption className="block text-[var(--ct-success)]">{note}</Caption>}

        <div className="border-t border-[var(--ct-border)] pt-3">
          <Body className="font-semibold !text-sm">Recent account events</Body>
          <AccountActivityLog activity={activity} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="ct-stack">
      <div className="ct-row-between gap-3">
        <div>
          <Heading level={3}>Account</Heading>
          <Caption className="block mt-0.5">{user?.email}</Caption>
          <Caption className="block mt-1 text-[var(--ct-success)]">Signed in · session active</Caption>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={signOut} className="!w-auto shrink-0">
          Logout
        </Button>
      </div>

      <div className="ct-stack-sm">
        <label className="ct-field-label">Username</label>
        <input
          className={inputClass}
          value={username || profile?.username || ""}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="How should we identify you?"
        />
      </div>

      <div className="ct-stack-sm">
        <label className="ct-field-label">PAN (format validation only)</label>
        <input
          className={inputClass}
          value={showPan ? pan || savedPan : pan || maskPan(savedPan)}
          onChange={(e) => setPan(e.target.value)}
          placeholder="ABCDE1234F"
        />
        <div className="ct-row-between">
          <button type="button" onClick={() => setShowPan((v) => !v)} className="ct-link !text-xs">
            {showPan ? "Hide PAN" : "Show PAN"}
          </button>
          <Caption>Status: {profile?.pan_verified ? "Verified" : "Not verified"}</Caption>
        </div>
      </div>

      <Button type="button" disabled={busy} onClick={handleSaveKyc} size="lg" variant="primary">
        Save account info
      </Button>
      {displayError && <Caption className="block text-[var(--ct-danger)]">{displayError}</Caption>}
      {note && <Caption className="block text-[var(--ct-success)]">{note}</Caption>}

      <div className="border-t border-[var(--ct-border)] pt-3 ct-stack-sm">
        <div className="ct-row-between">
          <Body className="font-semibold !text-sm">Account activity</Body>
          <Caption className="!text-[10px]">On this device</Caption>
        </div>
        <AccountActivityLog activity={activity} onClear={clearActivity} />
      </div>
    </Card>
  );
}
