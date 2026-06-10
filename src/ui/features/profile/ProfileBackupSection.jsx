import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Caption, Body, Heading, Button, Modal } from "../../index.js";
import { buildAppSnapshot } from "../../../storage/appSnapshot.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { buildAnnualReportData, formatAnnualReportPlainText } from "../../../engines/annualReport.js";
import { tierHasFeature } from "../../../utils/tierAccess.js";
import { buildCaSummarySnapshot, formatCaSummaryPlainText } from "../../../engines/caExport.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { ProGate } from "../../patterns/ProGate.jsx";
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
  const { t } = useTranslation();
  const ctx = useCommitTrack();
  const wealth = useNetWorth();
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
    if (tierHasFeature("health_report", ctx.settings)) {
      openHtmlInNewTab(generateAnnualReportHtml(report));
      return;
    }
    const text = formatAnnualReportPlainText(report);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "committrack-annual-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [ctx]);

  const exportCaJson = () => {
    const data = buildCaSummarySnapshot({
      commitments: ctx.commitments,
      lendings: ctx.lendings,
      goals: allGoals,
      settings: ctx.settings,
      wealth: {
        netWorth: wealth.core?.netWorth,
        liquidTotal: wealth.core?.liquidNetWorth,
        debtTotal: wealth.core?.totalLiabilities,
      },
      getEffectiveStatus: ctx.getEffectiveStatus,
      getEffectiveLendingStatus: ctx.getEffectiveLendingStatus,
      todayStr: ctx.todayStr,
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "committrack-ca-summary.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCaSummary = () => {
    const data = buildCaSummarySnapshot({
      commitments: ctx.commitments,
      lendings: ctx.lendings,
      goals: allGoals,
      settings: ctx.settings,
      wealth: {
        netWorth: wealth.core?.netWorth,
        liquidTotal: wealth.core?.liquidNetWorth,
        debtTotal: wealth.core?.totalLiabilities,
      },
      getEffectiveStatus: ctx.getEffectiveStatus,
      getEffectiveLendingStatus: ctx.getEffectiveLendingStatus,
      todayStr: ctx.todayStr,
    });
    const text = formatCaSummaryPlainText(data);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "committrack-ca-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const payload = buildAppSnapshot({
      commitments: allCommitments,
      lendings: allLendings,
      settings,
      monthlySnapshots,
      goals: allGoals,
      dailySpends: ctx.allDailySpends,
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
        setError(t("backup.readError"));
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
        t("backup.imported", {
          bills: summary.addedCommitments,
          lending: summary.addedLendings,
          goals: summary.addedGoals,
          mode,
        }),
      );
      setPreview(null);
      setPending(null);
    } catch (err) {
      setError((err instanceof Error ? err.message : null) || t("backup.importFailed"));
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
      setDeleteError((err instanceof Error ? err.message : null) || t("backup.deleteFailed"));
      setDeleting(false);
    }
  };

  return (
    <div className="ct-stack">
      <ProfileCloudSyncSection />

      <Card className="ct-stack">
        <div>
          <Heading level={3}>{t("backup.fileTitle")}</Heading>
          <Caption className="mt-1 block">{t("backup.fileSubtitle")}</Caption>
        </div>

        <button type="button" className="ct-list-row w-full text-left" onClick={exportJson}>
          <Body className="font-semibold">{t("backup.exportJson")}</Body>
          <Caption className="block mt-0.5">{t("backup.exportJsonHint")}</Caption>
        </button>

        <ProGate featureId="ca_share">
          <button type="button" className="ct-list-row w-full text-left" onClick={exportCaSummary}>
            <Body className="font-semibold">{t("caExport.download")}</Body>
            <Caption className="block mt-0.5">{t("caExport.hint")}</Caption>
          </button>
          <button type="button" className="ct-list-row w-full text-left" onClick={exportCaJson}>
            <Body className="font-semibold">{t("caExport.downloadJson")}</Body>
            <Caption className="block mt-0.5">{t("caExport.hintJson")}</Caption>
          </button>
        </ProGate>

        <div className="ct-stack">
          <Body className="font-semibold !text-sm">{t("backup.importJson")}</Body>
          <select className="ct-field w-full" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="merge">{t("backup.importMerge")}</option>
            <option value="replace">{t("backup.importReplace")}</option>
          </select>
          <input type="file" accept="application/json,.json" onChange={onFile} className="ct-field w-full !text-xs" />
          {preview && (
            <Caption className="block">
              {t("backup.preview", {
                bills: preview.commitments,
                lending: preview.lendings,
                goals: preview.goals,
                settings: preview.hasSettings ? t("backup.previewSettings") : "",
              })}
            </Caption>
          )}
          {pending && (
            <Button type="button" variant="primary" onClick={runImport}>
              {t("backup.confirmImport")}
            </Button>
          )}
          {error && <Caption className="block text-[var(--ct-danger)]">{error}</Caption>}
          {result && <Caption className="block text-[var(--ct-success)]">{result}</Caption>}
        </div>
      </Card>

      <Card className="ct-stack">
        <div>
          <Heading level={3}>{t("backup.deleteTitle")}</Heading>
          <Caption className="mt-1 block">
            {t("backup.deleteSubtitle", { cloud: user?.id ? t("backup.deleteCloud") : "" })}
          </Caption>
        </div>
        <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
          {t("backup.deleteAll")}
        </Button>
      </Card>

      {confirmDelete && (
        <Modal title={t("backup.deleteModalTitle")} onClose={() => !deleting && setConfirmDelete(false)}>
          <div className="ct-stack-sm">
            <Body className="!text-sm">
              {t("backup.deleteModalBody", {
                cloud: user?.id ? t("backup.deleteCloudModal") : t("backup.deleteSignout"),
              })}
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
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                disabled={deleting}
                onClick={handleDeleteAllData}
              >
                {deleting ? t("common.deleting") : t("backup.deleteConfirm")}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <div className="ct-plan-row">
        <div className="min-w-0 flex-1">
          <Heading level={4}>{t("backup.annualReport")}</Heading>
          <Caption className="block">
            {tierHasFeature("health_report", settings)
              ? t("backup.annualReportHintPro")
              : t("backup.annualReportHintFree")}
          </Caption>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={handleAnnualReport}>
          {t("common.generate")}
        </Button>
      </div>
    </div>
  );
}
