import { useState } from "react";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { previewImportCounts } from "../../utils/dataImport.js";

export default function DataImportSection() {
  const { importAppData } = useCommitTrack();
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
      const summary = importAppData(pending, { mode });
      setResult(
        `Imported: ${summary.addedCommitments} bills, ${summary.addedLendings} lending, ${summary.addedGoals} goals (${mode}).`
      );
      setPreview(null);
      setPending(null);
    } catch (err) {
      setError(err.message || "Import failed");
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-700">
      <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">Import JSON</p>
      <select
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
      >
        <option value="merge">Merge — keep existing, add new (skip duplicate ids)</option>
        <option value="replace">Replace — overwrite lists from file</option>
      </select>
      <input type="file" accept="application/json,.json" onChange={onFile} className="text-xs w-full" />
      {preview && (
        <p className="text-xs text-gray-600 dark:text-slate-400">
          Preview: {preview.commitments} bills, {preview.lendings} lending, {preview.goals} goals
          {preview.hasSettings ? ", includes settings" : ""}.
        </p>
      )}
      {pending && (
        <button
          type="button"
          onClick={runImport}
          className="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Confirm import
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {result && <p className="text-xs text-emerald-700">{result}</p>}
    </div>
  );
}
