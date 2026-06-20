import { useState } from "react";
import {
  parseBankStatementText,
  detectRecurringFromStatement,
  recurringToCommitmentDrafts,
} from "../../../engines/bankStatementParser.js";
import { extractTextFromPdfFile } from "../../../utils/bankPdfExtract.js";
import { bankRowsToDailySpendDrafts, filterDuplicateSpends } from "../../../utils/statementImport.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Modal, Stack, Button, Caption, Body } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { inputClassName } from "../../primitives/Input.jsx";
import { formatInr } from "../../../constants/symbols.js";

const fieldClass = `${inputClassName()} ct-input-tint`;

export default function BankStatementImportModal({ onClose }) {
  const { t } = useTranslation();
  const { addDailySpend, addCommitment, allDailySpends, settings } = usePerovo();
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(t("bills.import.reading"));
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
        bankDetected: parsed.bankDetected || parsed.bank,
        confidence: parsed.confidence || "medium",
        rowCount: parsed.rowCount ?? parsed.rows.length,
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
      setStatus(err instanceof Error ? err.message : t("bills.import.readError"));
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

  const skippedText =
    preview?.skippedDup > 0 ? t("bills.import.skippedDup", { count: preview.skippedDup }) : "";

  return (
    <Modal title={t("bills.importBankStatement")} onClose={onClose}>
      <Stack>
        <div className="ct-row gap-3 items-start">
          <span className="ct-icon-tile teal" aria-hidden>
            <CtIcon name="bank" size={22} />
          </span>
          <Caption>{t("bills.import.subtitle")}</Caption>
        </div>

        <input type="file" accept=".pdf,.csv,.txt" className={fieldClass} onChange={onFile} />
        {status ? <Caption className="ct-text-warning">{status}</Caption> : null}

        {preview ? (
          <div className="ct-hero-card wealth ct-stack-sm">
            <div className="ct-hero-glow teal" aria-hidden />
            <p className="ct-hero-label relative">{t("bills.importBankStatement")}</p>
            <p className="ct-hero-number ct-numeral relative">{preview.toImport}</p>
            <Body className="!text-sm relative">
              {t("bills.import.summary", {
                total: preview.total,
                bank: preview.bank,
                toImport: preview.toImport,
                skipped: skippedText,
              })}
            </Body>
            {preview.confidence ? (
              <Caption className="block relative">
                {preview.confidence === "high"
                  ? t("bills.importConfidenceHigh")
                  : preview.confidence === "medium"
                    ? t("bills.importConfidenceMedium")
                    : t("bills.importConfidenceLow")}
              </Caption>
            ) : null}
            {preview.confidence === "low" ? (
              <Caption className="ct-text-warning block relative">{t("bills.importLowConfidence")}</Caption>
            ) : null}
            {preview.warnings?.map((w) => (
              <Caption key={w} className="block relative">
                {w}
              </Caption>
            ))}
            {preview.recurring?.length > 0 ? (
              <div className="relative">
                <Caption className="font-semibold block">{t("bills.import.suggestedRecurring")}</Caption>
                {preview.recurring.slice(0, 6).map((r) => (
                  <Caption key={r.name} className="block">
                    {t("bills.import.recurringLine", {
                      name: r.name,
                      amount: formatInr(r.suggestedAmount),
                      occurrences: r.occurrences,
                      category: r.category,
                    })}
                  </Caption>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="ct-row gap-2 flex-wrap">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={!preview?.toImport || importing} onClick={runImport}>
            {t("bills.import.importSpends", { count: preview?.toImport || 0 })}
          </Button>
          <Button type="button" variant="outline" disabled={!preview?.billDrafts?.length} onClick={addRecurringBills}>
            {t("bills.import.addRecurring", { count: preview?.billDrafts?.length || 0 })}
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}
