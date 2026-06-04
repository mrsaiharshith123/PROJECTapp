import { useMemo, useState } from "react";
import { Button, inputClassName, Caption, Heading } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { isValidPan, maskPan, normalizePan } from "../../../utils/pan.js";
import { formatAuthError } from "../../../utils/authErrors.js";
import { normalizeIndianPhone } from "../../../utils/phone.js";

const inputClass = inputClassName();

/** Account sign-in & KYC — lives under Personal & money, not a top-level block. */
export default function AccountSettingsBlock() {
  const { isReady, isLoggedIn, user, profile, signOut, saveProfile } = useAuth();
  const { settings } = useCommitTrack();
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
      setNote("Signed out.");
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
      setNote("PAN format should be like ABCDE1234F.");
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
      setNote("Saved.");
    } catch (e) {
      setNote(formatAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  if (!isReady) {
    return <Caption>Loading account…</Caption>;
  }

  if (!isLoggedIn) {
    return (
      <Caption>
        Sign in from the app login screen to link this device to your account.
      </Caption>
    );
  }

  return (
    <div className="ct-stack-sm pt-2 border-t border-[var(--ct-border)]">
      <div>
        <Heading level={4}>Account</Heading>
        <Caption className="block mt-0.5">Sign-in, username, and optional PAN.</Caption>
      </div>

      <div className="ct-row-between gap-2">
        <Caption className="truncate">{user?.email}</Caption>
        <Button type="button" variant="outline" size="sm" onClick={handleSignOut} disabled={busy} className="!w-auto shrink-0">
          Logout
        </Button>
      </div>

      <div className="ct-stack-sm">
        <label className="ct-field-label">Username</label>
        <input
          className={inputClass}
          value={username || profile?.username || ""}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="ct-stack-sm">
        <label className="ct-field-label">PAN (format check)</label>
        <input
          className={inputClass}
          value={showPan ? pan || savedPan : pan || maskPan(savedPan)}
          onChange={(e) => setPan(e.target.value)}
          placeholder="ABCDE1234F"
        />
        <button type="button" onClick={() => setShowPan((v) => !v)} className="ct-link !text-xs text-left">
          {showPan ? "Hide PAN" : "Show PAN"}
        </button>
      </div>

      <Button type="button" disabled={busy} onClick={handleSaveKyc} size="sm" variant="secondary">
        Save account
      </Button>
      {note && <Caption className="block">{note}</Caption>}
    </div>
  );
}
