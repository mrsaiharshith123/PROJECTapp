import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfileBackupSection from "../ProfileBackupSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouBackupPage() {
  const { allCommitments, allLendings, allGoals, settings, monthlySnapshots } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.dataBackup">
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
