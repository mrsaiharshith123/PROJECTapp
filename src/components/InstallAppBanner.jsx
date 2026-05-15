import { usePwaInstall } from "../hooks/usePwaInstall.js";

function installHint({ showIosHint, showAndroidHint, canInstall }) {
  if (canInstall) {
    return "Tap Install app below, or use your browser menu → Install / Add to Home screen.";
  }
  if (showIosHint) {
    return "On iPhone/iPad: tap Share (↑) → Add to Home Screen. Then open CommitTrack from your home screen.";
  }
  if (showAndroidHint) {
    return "On Android Chrome: tap ⋮ menu → Install app, or Add to Home screen.";
  }
  return "Use your browser menu to install or add to home screen.";
}

export default function InstallAppBanner() {
  const { canInstall, showIosHint, showAndroidHint, showInstallUi, install, dismiss } = usePwaInstall();

  if (!showInstallUi) return null;

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Install CommitTrack</p>
        <p className="text-xs text-indigo-800/90 dark:text-indigo-200/80 mt-0.5 leading-relaxed">
          {installHint({ showIosHint, showAndroidHint, canInstall })}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {canInstall && (
          <button
            type="button"
            onClick={() => install()}
            className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Install app
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 rounded-lg bg-white/80 dark:bg-slate-900/80"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
