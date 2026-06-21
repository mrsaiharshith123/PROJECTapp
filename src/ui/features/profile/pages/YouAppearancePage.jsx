import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfilePersonalSection from "../ProfilePersonalSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouAppearancePage() {
  const { settings, updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.appearance">
      <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="appearance" />
    </YouSubPageShell>
  );
}
