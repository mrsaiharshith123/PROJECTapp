import { Card, Button, Caption, Body, Heading } from "../../index.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCloudSync } from "../../../hooks/useCloudSync.js";
import { isCloudSyncConfigured } from "../../../services/sync/syncEngine.js";

/** CommitTrack Cloud — optional continuity (local-first; sign-in required). */
export default function ProfileCloudSyncSection() {
  const { isLoggedIn } = useAuth();
  const { settings, updateSettings } = useCommitTrack();
  const sync = useCloudSync();
  const configured = isCloudSyncConfigured();

  if (!configured) {
    return (
      <Card className="ct-stack">
        <Heading level={3}>CommitTrack Cloud</Heading>
        <Caption className="block">
          Cloud sync is not configured for this build. Add Supabase keys to enable secure continuity.
        </Caption>
      </Card>
    );
  }

  if (!isLoggedIn) {
    return (
      <Card className="ct-stack">
        <Heading level={3}>CommitTrack Cloud</Heading>
        <Body className="!text-sm">
          Your finances stay on this device. Sign in under Account above to enable optional secure backup and
          multi-device sync.
        </Body>
        <Caption className="block opacity-90">
          Local storage · works offline · no account required for daily use
        </Caption>
      </Card>
    );
  }

  const enabled = Boolean(settings.cloudSyncEnabled);

  return (
    <Card className="ct-stack">
      <div>
        <Heading level={3}>CommitTrack Cloud</Heading>
        <Caption className="mt-1 block">
          Optional secure continuity — local data stays primary; cloud is backup and restore across devices.
        </Caption>
      </div>

      <div className="ct-hero-inset ct-stack gap-1 !text-xs">
        <p>• Data is stored locally on this device first.</p>
        <p>• When enabled, changes sync to your private cloud vault (RLS-isolated).</p>
        <p>• Works offline; syncs when you are back online.</p>
      </div>

      <label className="ct-row-between gap-3 cursor-pointer">
        <span>
          <Body className="font-semibold !text-sm">Enable cloud continuity</Body>
          <Caption className="block mt-0.5">Background backup after local saves</Caption>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => updateSettings({ cloudSyncEnabled: e.target.checked })}
          className="h-5 w-5 accent-[var(--ct-accent)]"
        />
      </label>

      {sync.meta?.lastPushedAt && (
        <Caption className="block">
          Last cloud backup: {new Date(sync.meta.lastPushedAt).toLocaleString("en-IN")}
        </Caption>
      )}

      <div className="ct-grid-2 gap-2">
        <Button type="button" variant="primary" disabled={!enabled || sync.busy} onClick={sync.pushNow}>
          {sync.busy ? "Working…" : "Back up now"}
        </Button>
        <Button type="button" variant="secondary" disabled={sync.busy} onClick={sync.forcePull}>
          Restore from cloud
        </Button>
      </div>

      {sync.message && <Caption className="block text-[var(--ct-success)]">{sync.message}</Caption>}
      {sync.error && <Caption className="block text-[var(--ct-danger)]">{sync.error}</Caption>}
    </Card>
  );
}
