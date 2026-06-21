import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfilePersonalSection from "../ProfilePersonalSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouMoneyPage() {
  const { settings, updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.incomeSalary">
      <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="money" />
    </YouSubPageShell>
  );
}
