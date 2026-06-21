import { Component } from "react";
import * as Sentry from "@sentry/react";
import { log } from "../../utils/logger.js";
import { useTranslationOptional } from "../../i18n/I18nProvider.js";

function ErrorFallback({ error, onReload }) {
  const { t } = useTranslationOptional();
  return (
    <div className="ct-page ct-stack-center min-h-screen justify-center">
      <div className="ct-card max-w-md w-full ct-stack">
        <h1 className="ct-onboard-title">{t("error.boundary.title")}</h1>
        <p className="ct-caption">{t("error.boundary.body")}</p>
        <pre className="ct-hero-inset text-xs overflow-auto max-h-40 text-[var(--ct-danger)]">
          {String(error?.message || error)}
        </pre>
        <button type="button" onClick={onReload} className="ct-btn ct-btn-primary">
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
      return <ErrorFallback error={this.state.error} onReload={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
