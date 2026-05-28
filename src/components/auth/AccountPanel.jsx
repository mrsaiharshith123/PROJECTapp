import { useMemo, useState } from "react";
import Card from "../Card.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { isValidPan, maskPan, normalizePan } from "../../utils/pan.js";
import { SELECTABLE_USER_MODES } from "../../constants/userModes.js";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm";

export default function AccountPanel() {
  const { isReady, isLoggedIn, user, profile, error, signIn, signUp, signOut, saveProfile } = useAuth();
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
      } else {
        await signUp(email, password, {
          display_name: signupName.trim(),
          user_mode: signupMode,
          household_scope: signupMode === "salaried" ? signupHouseholdScope : "single",
          monthly_income: Math.max(0, Number(signupIncome) || 0),
          onboarding_complete: true,
        });
        setNote("Account created. Please verify email if your project requires confirmation.");
      }
    } catch (e) {
      setLocalError(e.message || "Authentication failed.");
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
    } catch (e) {
      setLocalError(e.message || "Could not save account profile.");
    } finally {
      setBusy(false);
    }
  };

  if (!isReady) {
    return (
      <Card className="space-y-2">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Account</p>
        <p className="text-xs text-gray-500">Loading account...</p>
      </Card>
    );
  }

  if (!isLoggedIn) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Account</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`px-2 py-1 text-xs rounded-lg ${mode === "signin" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`px-2 py-1 text-xs rounded-lg ${mode === "signup" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
            >
              Create
            </button>
          </div>
        </div>
        <input
          type="email"
          className={inputClass}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className={inputClass}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "signup" && (
          <>
            <input
              className={inputClass}
              placeholder="Your name"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
            />
            <select className={inputClass} value={signupMode} onChange={(e) => setSignupMode(e.target.value)}>
              {SELECTABLE_USER_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            {signupMode === "salaried" && (
              <select
                className={inputClass}
                value={signupHouseholdScope}
                onChange={(e) => setSignupHouseholdScope(e.target.value)}
              >
                <option value="single">Single</option>
                <option value="family">Family</option>
              </select>
            )}
            <input
              type="number"
              min="0"
              className={inputClass}
              placeholder="Monthly income"
              value={signupIncome}
              onChange={(e) => setSignupIncome(e.target.value)}
            />
          </>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={handleAuth}
          className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {busy ? "Please wait..." : mode === "signin" ? "Login" : "Create account"}
        </button>
        {(localError || error) && <p className="text-xs text-red-600">{localError || error}</p>}
        {note && <p className="text-xs text-emerald-700">{note}</p>}
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Account</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Username</label>
        <input
          className={inputClass}
          value={username || profile?.username || ""}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="How should we identify you?"
        />
      </div>

      <div className="grid grid-cols-1 gap-2">
        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">PAN (format validation only)</label>
        <input
          className={inputClass}
          value={showPan ? pan || savedPan : pan || maskPan(savedPan)}
          onChange={(e) => setPan(e.target.value)}
          placeholder="ABCDE1234F"
        />
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowPan((v) => !v)}
            className="text-xs text-indigo-600 font-semibold"
          >
            {showPan ? "Hide PAN" : "Show PAN"}
          </button>
          <span className="text-[11px] text-gray-500">
            Status: {profile?.pan_verified ? "Verified" : "Not verified"}
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={handleSaveKyc}
        className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
      >
        Save account info
      </button>
      {(localError || error) && <p className="text-xs text-red-600">{localError || error}</p>}
      {note && <p className="text-xs text-emerald-700">{note}</p>}
    </Card>
  );
}
