import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import "./index.css";
import "./ui/styles/index.css";
import App from "./App.jsx";
import { log } from "./utils/logger.js";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const sentryEnabled =
  Boolean(sentryDsn) &&
  (import.meta.env.PROD || import.meta.env.VITE_SENTRY_ENABLE_DEV === "1");

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.PROD ? "production" : "development",
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
    ignoreErrors: ["ResizeObserver loop limit exceeded", "Network request failed"],
    beforeSend(event) {
      if (localStorage.getItem("perovo_no_analytics") === "1") return null;
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

if (import.meta.env.PROD && import.meta.env.VITE_EMBEDDED_APP !== "1") {
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}

log.app.info("Perovo starting", { mode: import.meta.env.MODE });

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("root_missing");

const root = createRoot(rootEl);
if (sentryEnabled) {
  root.render(
    <Sentry.ErrorBoundary fallback={<div className="p-6" style={{ textAlign: "center" }}>Something went wrong. Please refresh.</div>}>
      {app}
    </Sentry.ErrorBoundary>,
  );
} else {
  root.render(app);
}
