import { usePerovo } from "../../../../context/PerovoContext.jsx";
import HouseholdModeSection from "../HouseholdModeSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouHouseholdPage() {
  const { settings, updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.householdMode">
      <HouseholdModeSection settings={settings} updateSettings={updateSettings} />
    </YouSubPageShell>
  );
}
