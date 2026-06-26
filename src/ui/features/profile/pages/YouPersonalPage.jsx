import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfilePersonalSection from "../ProfilePersonalSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

/** Name, income, email, city — one place instead of three sub-pages. */
export default function YouPersonalPage() {
  const { settings, updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.personalDetails">
      <div className="ct-stat-tile !bg-transparent !border-0 !shadow-none !p-0">
        <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="profile" />
      </div>
    </YouSubPageShell>
  );
}
