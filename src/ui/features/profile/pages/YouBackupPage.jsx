import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfileBackupSection from "../ProfileBackupSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouBackupPage() {
  const { t } = useTranslation();
  const { allCommitments, allLendings, allGoals, settings, monthlySnapshots } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.dataBackup">
      <div className="ct-grid-2 gap-2">
        <div className="ct-stat-tile indigo">
          <p className="ct-stat-tile-label">{t("backup.exportJson")}</p>
          <p className="ct-stat-tile-value text-xs mt-1">{t("backup.exportJsonHint")}</p>
        </div>
        <div className="ct-stat-tile teal">
          <p className="ct-stat-tile-label">{t("backup.annualReport")}</p>
          <p className="ct-stat-tile-value text-xs mt-1">{t("backup.annualReportHint")}</p>
        </div>
      </div>
      <ProfileBackupSection
        allCommitments={allCommitments}
        allLendings={allLendings}
        allGoals={allGoals}
        settings={settings}
        monthlySnapshots={monthlySnapshots}
      />
    </YouSubPageShell>
  );
}
