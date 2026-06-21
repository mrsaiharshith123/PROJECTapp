import { useNavigate } from "react-router-dom";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfileSupportSection from "../ProfileSupportSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouAboutPage() {
  const navigate = useNavigate();
  const { updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.about">
      <ProfileSupportSection
        onOpenGuide={() => {
          updateSettings({ appGuideComplete: false });
          navigate("/", { state: { replayGuide: true } });
        }}
      />
    </YouSubPageShell>
  );
}
