import { usePerovo } from "../../../../context/PerovoContext.jsx";
import HouseholdModeSection from "../HouseholdModeSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouHouseholdPage() {
  const { settings, updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.householdMode">
      <div className="ct-stat-tile teal !bg-transparent !border-0 !shadow-none !p-0">
        <HouseholdModeSection settings={settings} updateSettings={updateSettings} />
      </div>
    </YouSubPageShell>
  );
}
