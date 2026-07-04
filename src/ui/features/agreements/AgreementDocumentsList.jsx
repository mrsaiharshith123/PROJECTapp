import { useMemo } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { downloadLendingAgreementHtml } from "../../../utils/agreementExport.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { semanticToneToClass } from "../../tokens/semanticBadge.js";

function formatDocDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(`${String(dateStr).slice(0, 10)}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function hasGeneratedDocument(lending) {
  return Boolean(
    lending.agreementLocked ||
      lending.agreementHash ||
      lending.agreementText?.trim() ||
      lending.esignStatus === "completed" ||
      lending.esignStatus === "pending",
  );
}

/** Documents sub-tab — NI Act promissory notes with eSign status. */
export default function AgreementDocumentsList() {
  const { t } = useTranslation();
  const { lendings, settings } = usePerovo();

  const documents = useMemo(
    () =>
      [...lendings]
        .filter(hasGeneratedDocument)
        .sort((a, b) =>
          String(b.agreementSealedAt || b.esignCompletedAt || b.dueDate || "").localeCompare(
            String(a.agreementSealedAt || a.esignCompletedAt || a.dueDate || ""),
          ),
        ),
    [lendings],
  );

  if (!documents.length) {
    return (
      <div className="pos-hero agreement">
        <p className="ed-caption">{t("agreements.documentsEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="ed-stack-sm">
      {documents.map((lending) => {
        const signed = lending.esignStatus === "completed";
        const date = lending.esignCompletedAt || lending.agreementSealedAt || lending.dueDate;
        return (
          <div key={lending.id} className="pos-document-row">
            <span className="ed-row-icon pos-icon agreement shrink-0">
              <CtIcon name="file-text" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="ed-body-strong truncate">{lending.personName}</p>
              <p className="ed-caption">{formatDocDate(date)}</p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${semanticToneToClass(signed ? "success" : "warning")}`}
              >
                {signed ? t("agreements.esignDone") : t("agreements.esignPending")}
              </span>
            </div>
            <button
              type="button"
              className="pos-document-download"
              onClick={() => downloadLendingAgreementHtml(lending, settings)}
            >
              {t("agreements.downloadPdf")}
            </button>
          </div>
        );
      })}
    </div>
  );
}
