import ProfileSecuritySection from "../ProfileSecuritySection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouSecurityPage() {
  return (
    <YouSubPageShell titleKey="settings.group.privacy">
      <ProfileSecuritySection />
    </YouSubPageShell>
  );
}
