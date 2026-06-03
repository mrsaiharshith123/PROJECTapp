import { usePwaInstall } from "../../hooks/usePwaInstall.js";
import { Button } from "../primitives/Button.jsx";
import { Row } from "../primitives/Stack.jsx";

function installHint({ showIosHint, showAndroidHint, canInstall }) {
  if (canInstall) return "Tap Install app below, or use your browser menu → Install / Add to Home screen.";
  if (showIosHint) return "On iPhone/iPad: tap Share (↑) → Add to Home Screen. Then open CommitTrack from your home screen.";
  if (showAndroidHint) return "On Android Chrome: tap ⋮ menu → Install app, or Add to Home screen.";
  return "Use your browser menu to install or add to home screen.";
}

export function InstallAppBanner() {
  const { canInstall, showIosHint, showAndroidHint, showInstallUi, install, dismiss } = usePwaInstall();

  if (!showInstallUi) return null;

  return (
    <div className="ct-promo">
      <Row between className="flex-wrap gap-3 items-start">
        <div className="min-w-0 flex-1">
          <p className="ct-promo-title">Install CommitTrack</p>
          <p className="ct-promo-body">{installHint({ showIosHint, showAndroidHint, canInstall })}</p>
        </div>
        <Row className="shrink-0">
          {canInstall && (
            <Button type="button" size="sm" onClick={() => install()}>
              Install app
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={dismiss}>
            Not now
          </Button>
        </Row>
      </Row>
    </div>
  );
}

export default InstallAppBanner;
