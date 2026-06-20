import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Caption, Body, Button, Modal } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { buildAppSnapshot } from "../../../storage/appSnapshot.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
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
import { SettingsGroup, SettingsGroupRow, SettingsGroupContent } from "./SettingsGroup.jsx";

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
  const ctx = usePerovo();
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
    a.download = "perovo-annual-report.txt";
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
    a.download = "perovo-ca-summary.json";
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
    a.download = "perovo-ca-summary.txt";
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
    a.download = "perovo-export.json";
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

      <SettingsGroup title={t("backup.fileTitle")} icon="file-text" description={t("backup.fileSubtitle")}>
        <SettingsGroupRow
          icon="file-text"
          iconColor="teal"
          label={t("backup.exportJson")}
          hint={t("backup.exportJsonHint")}
          onClick={exportJson}
        />
        <ProGate featureId="ca_share">
          <SettingsGroupRow
            icon="file-text"
            iconColor="violet"
            label={t("caExport.download")}
            hint={t("caExport.hint")}
            onClick={exportCaSummary}
          />
          <SettingsGroupRow
            icon="clipboard-text"
            iconColor="violet"
            label={t("caExport.downloadJson")}
            hint={t("caExport.hintJson")}
            onClick={exportCaJson}
          />
        </ProGate>
        <SettingsGroupContent className="ct-stack">
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
        </SettingsGroupContent>
      </SettingsGroup>

      <SettingsGroup title={t("backup.deleteTitle")} icon="warning" description={t("backup.deleteSubtitle", { cloud: user?.id ? t("backup.deleteCloud") : "" })}>
        <SettingsGroupContent>
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            {t("backup.deleteAll")}
          </Button>
        </SettingsGroupContent>
      </SettingsGroup>

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

      <SettingsGroup title={t("backup.annualReport")} icon="chart-bar" description={tierHasFeature("health_report", settings) ? t("backup.annualReportHintPro") : t("backup.annualReportHintFree")}>
        <SettingsGroupContent>
          <div className="ct-row-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="ct-icon-tile ct-icon-tile-sm amber inline-flex mr-2 align-middle">
                <CtIcon name="chart-line-up" size={18} weight="duotone" />
              </span>
              <Caption className="inline align-middle">
                {tierHasFeature("health_report", settings)
                  ? t("backup.annualReportHintPro")
                  : t("backup.annualReportHintFree")}
              </Caption>
            </div>
            <Button type="button" variant="primary" size="sm" onClick={handleAnnualReport} className="!w-auto shrink-0">
              {t("common.generate")}
            </Button>
          </div>
        </SettingsGroupContent>
      </SettingsGroup>
    </div>
  );
}
