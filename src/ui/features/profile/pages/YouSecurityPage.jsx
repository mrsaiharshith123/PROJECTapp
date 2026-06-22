import ProfileSecuritySection from "../ProfileSecuritySection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouSecurityPage() {
  return (
    <YouSubPageShell titleKey="settings.group.privacy">
      <div className="ct-stat-tile !bg-transparent !border-0 !shadow-none !p-0">
        <ProfileSecuritySection />
      </div>
    </YouSubPageShell>
  );
}
