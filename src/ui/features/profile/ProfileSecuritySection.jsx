import { Card, Caption, Body, Heading } from "../../index.js";
import { buildAppSnapshot } from "../../../storage/appSnapshot.js";

export default function ProfileSecuritySection({
  allCommitments,
  allLendings,
  allGoals,
  settings,
  monthlySnapshots,
  businessInvoices,
  updateSettings,
}) {
  const exportJson = () => {
    const payload = buildAppSnapshot({
      commitments: allCommitments,
      lendings: allLendings,
      settings,
      monthlySnapshots,
      goals: allGoals,
      businessInvoices,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "committrack-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="ct-stack">
      <div>
        <Heading level={3}>Data on this device</Heading>
        <Caption className="mt-1 block">
          Local-first storage — your operating system runs here. Optional cloud continuity is in CommitTrack Cloud.
        </Caption>
      </div>

      <div className="ct-hero-inset ct-stack gap-1 !text-xs">
        <p>• Finance data lives in browser local storage on this device.</p>
        <p>• Export JSON anytime for your own archive.</p>
        <p>• Clearing site data removes local CommitTrack data.</p>
      </div>

      <button type="button" className="ct-list-row w-full text-left" onClick={exportJson}>
        <Body className="font-semibold">Export JSON backup</Body>
        <Caption className="block mt-0.5">Manual file backup — works without cloud</Caption>
      </button>

      <button
        type="button"
        className="ct-btn ct-btn-ghost w-full"
        onClick={() => updateSettings({ readNotificationIds: [] })}
      >
        Mark all notifications as read
      </button>
    </Card>
  );
}
