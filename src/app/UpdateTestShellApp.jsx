import { BrowserRouter } from "react-router-dom";
import { routerBasename } from "../utils/basePath.js";
import { I18nProvider } from "../i18n/index.js";
import ThemeSync from "./ThemeSync.jsx";
import ErrorBoundary from "../ui/layout/ErrorBoundary.jsx";
import UpdateTestShell from "../ui/features/UpdateTestShell.jsx";

export default function UpdateTestShellApp() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <I18nProvider standalone>
        <ThemeSync />
        <ErrorBoundary>
          <UpdateTestShell />
        </ErrorBoundary>
      </I18nProvider>
    </BrowserRouter>
  );
}
