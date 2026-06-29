import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfileBackupSection from "../ProfileBackupSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";
import { useTranslation } from "../../../../i18n/I18nProvider.js";

/** Local export and annual report. */
export default function YouBackupPage() {
  const { t } = useTranslation();
  const { allCommitments, allLendings, allGoals, settings, monthlySnapshots } = usePerovo();

  return (
    <YouSubPageShell titleKey="settings.row.dataBackup">
      <div className="ed-you-section">
        <div className="ed-ins-kicker">{t("backup.exportOptionsKicker")}</div>
        <ProfileBackupSection
          allCommitments={allCommitments}
          allLendings={allLendings}
          allGoals={allGoals}
          settings={settings}
          monthlySnapshots={monthlySnapshots}
        />
      </div>
    </YouSubPageShell>
  );
}
