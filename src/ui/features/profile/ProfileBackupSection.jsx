import { useCallback, useState } from "react";
import { Card, Caption, Body, Heading, Button } from "../../index.js";
import { ProGate } from "../../patterns/ProGate.jsx";
import { buildAppSnapshot } from "../../../storage/appSnapshot.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { buildAnnualReportData } from "../../../engines/annualReport.js";
import { generateAnnualReportHtml } from "../../../utils/annualReportHtml.js";
import { openHtmlInNewTab } from "../../../utils/lendingShareCard.js";
import { previewImportCounts } from "../../../utils/dataImport.js";
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
  const ctx = useCommitTrack();
  const { importAppData } = ctx;
  const [preview, setPreview] = useState(null);
  const [pending, setPending] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("merge");

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
