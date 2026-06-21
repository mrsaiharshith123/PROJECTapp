import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfilePersonalSection from "../ProfilePersonalSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouAccountPage() {
  const { settings, updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.emailPassword">
      <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="account" />
    </YouSubPageShell>
  );
}
