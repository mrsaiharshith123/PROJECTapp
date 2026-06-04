import { useState } from "react";
import { Button, Caption, Body } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { previewImportCounts } from "../../../utils/dataImport.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useCloudSync } from "../../../hooks/useCloudSync.js";

export default function DataImportSection() {
  const { importAppData } = useCommitTrack();
  const { isLoggedIn } = useAuth();
  const cloud = useCloudSync();
  const [preview, setPreview] = useState(null);
  const [pending, setPending] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("merge");

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

  const restoreFromCloud = async () => {
    setError(null);
    setResult(null);
    if (!isLoggedIn) {
      setError("Sign in and enable CommitTrack Cloud to restore.");
      return;
    }
    await cloud.forcePull();
    if (cloud.message) setResult(cloud.message);
    if (cloud.error) setError(cloud.error);
  };

  return (
    <div className="ct-stack pt-2 border-t border-[var(--ct-border)]">
      <Body className="font-semibold !text-sm">Import JSON</Body>
      <select
        className="ct-field w-full"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
      >
        <option value="merge">Merge — keep existing, add new (skip duplicate ids)</option>
        <option value="replace">Replace — overwrite lists from file</option>
      </select>
      <input type="file" accept="application/json,.json" onChange={onFile} className="ct-field w-full !text-xs" />
      {preview && (
        <Caption className="block">
          Preview: {preview.commitments} bills, {preview.lendings} lending, {preview.goals} goals
          {preview.businessInvoices ? `, ${preview.businessInvoices} invoices` : ""}
          {preview.hasSettings ? ", includes settings" : ""}.
        </Caption>
      )}
      {pending && (
        <Button type="button" variant="primary" onClick={runImport}>
          Confirm import
        </Button>
      )}
      <Button type="button" variant="secondary" disabled={cloud.busy} onClick={restoreFromCloud}>
        {cloud.busy ? "Restoring…" : "Restore from CommitTrack Cloud"}
      </Button>
      {error && <Caption className="block text-[var(--ct-danger)]">{error}</Caption>}
      {result && <Caption className="block text-[var(--ct-success)]">{result}</Caption>}
    </div>
  );
}
