import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfilePersonalSection from "../ProfilePersonalSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouMoneyPage() {
  const { settings, updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.incomeSalary">
      <div className="ct-stat-tile !bg-transparent !border-0 !shadow-none !p-0">
        <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="money" />
      </div>
    </YouSubPageShell>
  );
}
