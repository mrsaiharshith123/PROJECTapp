import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import "./index.css";
import "./ui/styles/index.css";
import { I18nProvider } from "./i18n/index.js";
import App from "./App.jsx";
import { log } from "./utils/logger.js";
import { isNativeCapacitorShell } from "./utils/nativePermissions.js";
import { applyDevPhoneFrameBootAttrs } from "./utils/devPhoneFrame.js";
import DevPhoneFrame from "./ui/dev/DevPhoneFrame.jsx";

applyDevPhoneFrameBootAttrs();

if (isNativeCapacitorShell()) {
  document.documentElement.style.webkitUserSelect = "none";
  document.documentElement.style.userSelect = "none";
  document.addEventListener("contextmenu", (e) => e.preventDefault(), true);
  document.addEventListener("dragstart", (e) => e.preventDefault(), true);
}

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const sentryEnabled =
  Boolean(sentryDsn) &&
  (import.meta.env.PROD || import.meta.env.VITE_SENTRY_ENABLE_DEV === "1");

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: Boolean(sentryDsn),
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
    ignoreErrors: ["ResizeObserver loop limit exceeded", "Network request failed"],
    beforeSend(event) {
      if (localStorage.getItem("perovo_no_analytics") === "1") return null;
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
      }
      return event;
    },
  });
}

if (import.meta.env.VITE_POSTHOG_KEY && import.meta.env.PROD) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://app.posthog.com",
    autocapture: false,
    capture_pageview: true,
    persistence: "memory",
    person_profiles: "identified_only",
  });
}

log.app.info("Perovo starting", { mode: import.meta.env.MODE });

const app = (
  <StrictMode>
    <I18nProvider>
      {import.meta.env.DEV ? (
        <DevPhoneFrame>
          <App />
        </DevPhoneFrame>
      ) : (
        <App />
      )}
    </I18nProvider>
  </StrictMode>
);

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("root_missing");

const root = createRoot(rootEl);
if (sentryEnabled) {
  root.render(
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <div className="p-6 ct-stack" style={{ textAlign: "center", maxWidth: 480, margin: "2rem auto" }}>
          <p>Something went wrong. Please refresh.</p>
          {import.meta.env.DEV && error ? (
            <pre className="ct-hero-inset ct-caption">
              {String(error instanceof Error ? error.message : error)}
            </pre>
          ) : null}
        </div>
      )}
    >
      {app}
    </Sentry.ErrorBoundary>,
  );
} else {
  root.render(app);
}
