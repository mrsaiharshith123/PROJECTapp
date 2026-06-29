import ProfileSecuritySection from "../ProfileSecuritySection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

/** Sessions and account security. */
export default function YouSecurityPage() {
  return (
    <YouSubPageShell titleKey="settings.group.privacy">
      <ProfileSecuritySection />
    </YouSubPageShell>
  );
}
