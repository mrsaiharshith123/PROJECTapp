import { Component } from "react";
import { log } from "../../utils/logger.js";

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
  }

  render() {
    if (this.state.error) {
      return (
        <div className="ct-page ct-stack-center min-h-screen justify-center">
          <div className="ct-card max-w-md w-full ct-stack">
            <h1 className="ct-onboard-title">Something went wrong</h1>
            <p className="ct-caption">
              CommitTrack hit an error while loading. Try refreshing. If it keeps happening, clear site data for this
              origin in your browser settings.
            </p>
            <pre className="ct-hero-inset text-xs overflow-auto max-h-40 text-[var(--ct-danger)]">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button type="button" onClick={() => window.location.reload()} className="ct-btn ct-btn-primary">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
