import updateTestShellMessages from "../i18n/updateTestShellMessages.js";
import { UpdateTestShellI18n } from "../i18n/UpdateTestShellI18n.jsx";
import UpdateTestShell from "../ui/features/UpdateTestShell.jsx";

/** Minimal tree — no router, Perovo, locales, or full App.jsx. */
export default function UpdateTestShellApp() {
  return (
    <UpdateTestShellI18n messages={updateTestShellMessages}>
      <UpdateTestShell />
    </UpdateTestShellI18n>
  );
}
