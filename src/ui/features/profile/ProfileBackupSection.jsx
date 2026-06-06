import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Caption, Body, Heading, Button, Modal } from "../../index.js";
import { ProGate } from "../../patterns/ProGate.jsx";
import { buildAppSnapshot } from "../../../storage/appSnapshot.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { buildAnnualReportData } from "../../../engines/annualReport.js";
import { generateAnnualReportHtml } from "../../../utils/annualReportHtml.js";
import { openHtmlInNewTab } from "../../../utils/lendingShareCard.js";
import { previewImportCounts } from "../../../utils/dataImport.js";
import { clearAllLocalData } from "../../../utils/migrateStorage.js";
import { deleteAccountData } from "../../../services/supabase/auth.js";
import ProfileCloudSyncSection from "./ProfileCloudSyncSection.jsx";

/**
 * Account backup (Supabase), JSON export, import, and annual report — one place.
 */
export default function ProfileBackupSection({
  allCommitments,
  allLendings,
  allGoals,
  settings,
  monthlySnapshots,
}) {
  const navigate = useNavigate();
  const ctx = useCommitTrack();
  const { user } = useAuth();
  const { importAppData } = ctx;
  const [preview, setPreview] = useState(null);
  const [pending, setPending] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("merge");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleAnnualReport = useCallback(() => {
    const report = buildAnnualReportData({
      commitments: ctx.commitments,
      lendings: ctx.lendings,
      settings: ctx.settings,
      monthlySnapshots: ctx.monthlySnapshots,
      getEffectiveStatus: ctx.getEffectiveStatus,
      getEffectiveLendingStatus: ctx.getEffectiveLendingStatus,
      todayStr: ctx.todayStr,
    });
    openHtmlInNewTab(generateAnnualReportHtml(report));
  }, [ctx]);

  const exportJson = () => {
    const payload = buildAppSnapshot({
      commitments: allCommitments,
      lendings: allLendings,
      settings,
      monthlySnapshots,
      goals: allGoals,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "committrack-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = (e) => {
    setError(null);
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        setPreview(previewImportCounts(data));
        setPending(data);
      } catch {
        setPreview(null);
        setPending(null);
        setError("Could not read JSON. Use a CommitTrack export file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const runImport = () => {
    if (!pending) return;
    try {
      const summary = /** @type {{ addedCommitments: number, addedLendings: number, addedGoals: number }} */ (
        importAppData(pending, { mode })
      );
      setResult(
        `Imported: ${summary.addedCommitments} bills, ${summary.addedLendings} lending, ${summary.addedGoals} goals (${mode}).`,
      );
      setPreview(null);
      setPending(null);
    } catch (err) {
      setError((err instanceof Error ? err.message : null) || "Import failed");
    }
  };

  const handleDeleteAllData = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      clearAllLocalData();
      if (user?.id) {
        await deleteAccountData(user.id);
      }
      setConfirmDelete(false);
      navigate("/", { replace: true });
      window.location.reload();
    } catch (err) {
      setDeleteError((err instanceof Error ? err.message : null) || "Could not delete account data.");
      setDeleting(false);
    }
  };

  return (
    <div className="ct-stack">
      <ProfileCloudSyncSection />

      <Card className="ct-stack">
        <div>
          <Heading level={3}>File backup</Heading>
          <Caption className="mt-1 block">
            Export or import a JSON file on this device. Restore from Supabase is in Account backup above.
          </Caption>
        </div>

        <button type="button" className="ct-list-row w-full text-left" onClick={exportJson}>
          <Body className="font-semibold">Export JSON backup</Body>
          <Caption className="block mt-0.5">Save bills, lending, goals, and settings to a file</Caption>
        </button>

        <div className="ct-stack">
          <Body className="font-semibold !text-sm">Import JSON</Body>
          <select className="ct-field w-full" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="merge">Merge — keep existing, add new (skip duplicate ids)</option>
            <option value="replace">Replace — overwrite lists from file</option>
          </select>
          <input type="file" accept="application/json,.json" onChange={onFile} className="ct-field w-full !text-xs" />
          {preview && (
            <Caption className="block">
              Preview: {preview.commitments} bills, {preview.lendings} lending, {preview.goals} goals
              {preview.hasSettings ? ", includes settings" : ""}.
            </Caption>
          )}
          {pending && (
            <Button type="button" variant="primary" onClick={runImport}>
              Confirm import
            </Button>
          )}
          {error && <Caption className="block text-[var(--ct-danger)]">{error}</Caption>}
          {result && <Caption className="block text-[var(--ct-success)]">{result}</Caption>}
        </div>
      </Card>

      <Card className="ct-stack">
        <div>
          <Heading level={3}>Delete all data</Heading>
          <Caption className="mt-1 block">
            Permanently erase all bills, lending, and settings on this device
            {user?.id ? " and your cloud profile" : ""}. This cannot be undone.
          </Caption>
        </div>
        <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
          Delete all data
        </Button>
      </Card>

      {confirmDelete && (
        <Modal
          title="Delete all data?"
          onClose={() => !deleting && setConfirmDelete(false)}
        >
          <div className="ct-stack-sm">
            <Body className="!text-sm">
              This removes all local data and{user?.id ? " deletes your Supabase profile." : " signs you out of cloud sync."}{" "}
              Export a backup first if you need your records.
            </Body>
            {deleteError && <Caption className="block text-[var(--ct-danger)]">{deleteError}</Caption>}
            <div className="ct-row">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                disabled={deleting}
                onClick={handleDeleteAllData}
              >
                {deleting ? "Deleting…" : "Yes, delete everything"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ProGate featureId="health_report">
        <div className="ct-plan-row">
          <div className="min-w-0 flex-1">
            <Heading level={4}>Annual report</Heading>
            <Caption className="block">Year summary — pressure, subs, survival (Pro).</Caption>
          </div>
          <Button type="button" variant="primary" size="sm" onClick={handleAnnualReport}>
            Generate
          </Button>
        </div>
      </ProGate>
    </div>
  );
}
