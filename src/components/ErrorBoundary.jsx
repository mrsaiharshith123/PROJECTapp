import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 shadow-sm p-6 space-y-3">
            <h1 className="text-lg font-bold text-gray-900">Something went wrong</h1>
            <p className="text-sm text-gray-600">
              CommitTrack hit an error while loading. Try refreshing. If it keeps happening, clear site data for
              localhost in your browser settings.
            </p>
            <pre className="text-xs text-red-700 bg-red-50 rounded-lg p-3 overflow-auto max-h-40">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
