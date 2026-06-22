import { useNavigate } from "react-router-dom";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfileGuidanceSection from "../ProfileGuidanceSection.jsx";
import ProfileSupportSection from "../ProfileSupportSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouSupportPage() {
  const navigate = useNavigate();
  const { updateSettings } = usePerovo();
  const replayGuide = () => {
    updateSettings({ appGuideComplete: false });
    navigate("/", { state: { replayGuide: true } });
  };

  return (
    <YouSubPageShell titleKey="settings.row.help">
      <div className="ct-stat-tile violet !bg-transparent !border-0 !shadow-none !p-0 ct-stack">
        <ProfileGuidanceSection onStartGuide={replayGuide} />
        <ProfileSupportSection onOpenGuide={replayGuide} />
      </div>
    </YouSubPageShell>
  );
}
