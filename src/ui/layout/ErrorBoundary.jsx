import { Component } from "react";
import * as Sentry from "@sentry/react";
import { log } from "../../utils/logger.js";
import { useTranslationOptional } from "../../i18n/I18nProvider.js";

function ErrorFallback({ error, onReload }) {
  const { t } = useTranslationOptional();
  return (
    <div className="ed-page ed-stack-center min-h-screen justify-center">
      <div className="ed-inset max-w-md w-full ed-stack">
        <h1 className="ed-page-shell-title">{t("error.boundary.title")}</h1>
        <p className="ed-caption">{t("error.boundary.body")}</p>
        <pre className="ed-inset text-xs overflow-auto max-h-40 text-[var(--ed-red)]">
          {String(error?.message || error)}
        </pre>
        <button type="button" onClick={onReload} className="ed-btn ed-btn-primary">
          {t("error.boundary.reload")}
        </button>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    log.app.error("UI crash", {
      message: error instanceof Error ? error.message : String(error),
      componentStack: info?.componentStack?.slice(0, 200),
    });
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, { extra: { componentStack: info?.componentStack } });
    }
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallback error={this.state.error} onReload={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}

/** Lightweight boundary for individual routes — inline error, not full screen */
export function RouteErrorBoundary({ children, routeName }) {
  return (
    <ErrorBoundary
      fallback={
        <div
          style={{
            padding: "2rem 1.5rem",
            textAlign: "center",
            color: "var(--ed-ink-faint)",
          }}
        >
          <p
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontStyle: "italic",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            {routeName ? `${routeName} failed to load.` : "This section couldn't load."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ed-gold)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Reload app →
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
