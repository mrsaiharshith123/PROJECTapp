import { usePwaInstall } from "../hooks/usePwaInstall.js";

export default function InstallAppBanner() {
  const { canInstall, showIosHint, install, dismiss } = usePwaInstall();

  if (!canInstall && !showIosHint) return null;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-indigo-900">Install CommitTrack</p>
        <p className="text-xs text-indigo-700/90 mt-0.5">
          {showIosHint && !canInstall
            ? "On iPhone: Share → Add to Home Screen for an app-like experience."
            : "Add to your home screen for quick access and offline shell support."}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {canInstall && (
          <button
            type="button"
            onClick={() => install()}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Install app
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-200 rounded-lg bg-white/80"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
