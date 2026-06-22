import { useNavigate } from "react-router-dom";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfileSupportSection from "../ProfileSupportSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouAboutPage() {
  const navigate = useNavigate();
  const { updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.about">
      <div className="ct-stat-tile !bg-transparent !border-0 !shadow-none !p-0">
        <ProfileSupportSection
          onOpenGuide={() => {
            updateSettings({ appGuideComplete: false });
            navigate("/", { state: { replayGuide: true } });
          }}
        />
      </div>
    </YouSubPageShell>
  );
}
