import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfileNotificationsSection from "../ProfileNotificationsSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouNotificationsPage() {
  const { settings, updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.reminders">
      <ProfileNotificationsSection settings={settings} updateSettings={updateSettings} />
    </YouSubPageShell>
  );
}
