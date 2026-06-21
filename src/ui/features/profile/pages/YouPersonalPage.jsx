import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfilePersonalSection from "../ProfilePersonalSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouPersonalPage() {
  const { settings, updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.personalDetails">
      <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="identity" />
    </YouSubPageShell>
  );
}
