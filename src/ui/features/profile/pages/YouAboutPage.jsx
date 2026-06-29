import ProfileAboutSection from "../ProfileAboutSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouAboutPage() {
  return (
    <YouSubPageShell titleKey="settings.row.about">
      <ProfileAboutSection />
    </YouSubPageShell>
  );
}
