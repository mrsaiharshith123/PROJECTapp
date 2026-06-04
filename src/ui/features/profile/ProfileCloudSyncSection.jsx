import { useNavigate } from "react-router-dom";
import { Card, Button, Caption, Body, Heading } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCloudSync } from "../../../hooks/useCloudSync.js";
import { isCloudSyncConfigured } from "../../../services/sync/syncEngine.js";
import { hasPaidBackupTier } from "../../../constants/subscriptionTiers.js";

/** Supabase account backup — Pro/Power only; optional enable toggle. */
export default function ProfileCloudSyncSection() {
  const navigate = useNavigate();
  const { isLoggedIn, user, profile } = useAuth();
  const { settings, updateSettings } = useCommitTrack();
  const sync = useCloudSync();
  const configured = isCloudSyncConfigured();
  const paid = hasPaidBackupTier(settings);
  const enabled = Boolean(settings.cloudSyncEnabled);

  const accountLabel =
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    user?.email ||
    "Your account";

  if (!configured) {
    return (
      <Card className="ct-stack">
        <Heading level={3}>Account backup</Heading>
        <Caption className="block">
          Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then run migrations
          in supabase/migrations/.
        </Caption>
      </Card>
    );
  }

  if (!paid) {
    return (
      <Card className="ct-stack">
        <Heading level={3}>Account backup</Heading>
        <Body className="!text-sm">
          Free plan keeps data on this device only. Upgrade to Pro or Power to save a private Supabase backup
          under your account (enable or disable anytime).
        </Body>
        <Caption className="block">You can still export and import JSON files below.</Caption>
        <Button type="button" variant="primary" size="sm" onClick={() => navigate("/profile#upgrade")}>
          View plans →
        </Button>
      </Card>
    );
  }

  if (!isLoggedIn) {
    return (
      <Card className="ct-stack">
        <Heading level={3}>Account backup</Heading>
        <Body className="!text-sm">
          Your plan includes Supabase backup. Sign in under Account, then turn backup on to save this
          device&apos;s data under {accountLabel}.
        </Body>
        <Caption className="block opacity-90">Local data stays on the device until you choose to restore.</Caption>
      </Card>
    );
  }

  return (
    <Card className="ct-stack">
      <div>
        <Heading level={3}>Account backup</Heading>
        <Body className="!text-sm mt-1">
          Account: {accountLabel} — one private row in Supabase (RLS). Local storage stays primary.
        </Body>
      </div>

      <label className="ct-row-between gap-3 cursor-pointer">
        <span>
          <Body className="font-semibold !text-sm">Use Supabase backup</Body>
          <Caption className="block mt-0.5">
            Off = local only on this device. On = back up & restore via your account.
          </Caption>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => updateSettings({ cloudSyncEnabled: e.target.checked })}
          className="h-5 w-5 accent-[var(--ct-accent)]"
        />
      </label>

      {enabled && (
        <>
          <div className="ct-hero-inset ct-stack gap-1 !text-xs">
            <p>• Back up now saves your current data to Supabase.</p>
            <p>• Restore replaces this device with your last saved backup.</p>
            <p>• Auto-backup runs a few seconds after you edit (when enabled).</p>
          </div>

          {sync.meta?.lastPushedAt && (
            <Caption className="block">
              Last backup: {new Date(sync.meta.lastPushedAt).toLocaleString("en-IN")}
            </Caption>
          )}

          <div className="ct-grid-2 gap-2">
            <Button type="button" variant="primary" disabled={sync.busy} onClick={sync.pushNow}>
              {sync.busy ? "Working…" : "Back up now"}
            </Button>
            <Button type="button" variant="secondary" disabled={sync.busy} onClick={sync.forcePull}>
              Restore from backup
            </Button>
          </div>
        </>
      )}

      {!enabled && (
        <Caption className="block">
          Backup is off — your data stays local only. Turn on when you want Supabase storage.
        </Caption>
      )}

      {sync.message && <Caption className="block text-[var(--ct-success)]">{sync.message}</Caption>}
      {sync.error && <Caption className="block text-[var(--ct-danger)]">{sync.error}</Caption>}
    </Card>
  );
}
