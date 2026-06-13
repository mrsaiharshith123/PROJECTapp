import { useState } from "react";
import {
  parseBankStatementText,
  detectRecurringFromStatement,
  recurringToCommitmentDrafts,
} from "../../../engines/bankStatementParser.js";
import { extractTextFromPdfFile } from "../../../utils/bankPdfExtract.js";
import { bankRowsToDailySpendDrafts, filterDuplicateSpends } from "../../../utils/statementImport.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Modal, Stack, Button, Caption, Body } from "../../index.js";

export default function BankStatementImportModal({ onClose }) {
  const { t } = useTranslation();
  const { addDailySpend, addCommitment, allDailySpends, settings } = useCommitTrack();
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("Reading file…");
    try {
      let text = "";
      if (file.name.toLowerCase().endsWith(".pdf")) {
        text = await extractTextFromPdfFile(file);
      } else {
        text = await file.text();
      }
      const parsed = parseBankStatementText(text, { filename: file.name });
      const { drafts } = bankRowsToDailySpendDrafts(parsed.rows, settings.activeProfileId || "default");
      const filtered = filterDuplicateSpends(drafts, allDailySpends);
      const recurring = detectRecurringFromStatement(parsed.rows);
      const billDrafts = recurringToCommitmentDrafts(recurring);
      setPreview({
        bank: parsed.bank,
        warnings: parsed.warnings,
        total: parsed.rows.length,
        toImport: filtered.length,
        skippedDup: drafts.length - filtered.length,
        drafts: filtered,
        recurring,
        billDrafts,
      });
      setStatus("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not read file.");
      setPreview(null);
    }
    e.target.value = "";
  };

  const runImport = async () => {
    if (!preview?.drafts?.length) return;
    setImporting(true);
    for (const d of preview.drafts) {
      addDailySpend(d);
    }
    setImporting(false);
    onClose();
  };

  const addRecurringBills = () => {
    if (!preview?.billDrafts?.length) return;
    for (const d of preview.billDrafts) {
      addCommitment(d);
    }
    onClose();
  };

  return (
    <Modal title={t("bills.importBankStatement")} onClose={onClose}>
      <Stack>
        <Caption>
          Upload bank PDF (text-based), CSV export, or plain text. Debits import as variable spend; recurring patterns can become bills.
        </Caption>
        <input type="file" accept=".pdf,.csv,.txt" className="ct-input" onChange={onFile} />
        {status ? <Caption className="ct-text-warning">{status}</Caption> : null}
        {preview && (
          <div className="ct-inset ct-stack-sm">
            <Body className="!text-sm">
              Detected {preview.total} transactions ({preview.bank}) · {preview.toImport} new debits
              {preview.skippedDup > 0 ? ` · ${preview.skippedDup} duplicates skipped` : ""}
            </Body>
            {preview.warnings?.map((w) => (
              <Caption key={w} className="block">
                {w}
              </Caption>
            ))}
            {preview.recurring?.length > 0 && (
              <div>
                <Caption className="font-semibold block">Suggested recurring bills</Caption>
                {preview.recurring.slice(0, 6).map((r) => (
                  <Caption key={r.name} className="block">
                    {r.name} — ₹{r.suggestedAmount.toLocaleString("en-IN")}/mo ({r.occurrences}× seen) · {r.category}
                  </Caption>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="ct-row gap-2 flex-wrap">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!preview?.toImport || importing} onClick={runImport}>
            Import {preview?.toImport || 0} spends
          </Button>
          <Button type="button" variant="outline" disabled={!preview?.billDrafts?.length} onClick={addRecurringBills}>
            Add {preview?.billDrafts?.length || 0} recurring bills
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}
