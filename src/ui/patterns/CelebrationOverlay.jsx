import { lazy, Suspense, useEffect, useRef } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";

const LottiePlayer = lazy(() =>
  import("@lottiefiles/react-lottie-player").then((mod) => ({ default: mod.Player })),
);

// NOTE: these lottiefiles.com CDN URLs are third-party and unpinned — verified
// 403ing as of this pass, meaning the celebration animation is very likely
// silently failing in production right now. Needs the team to source/host
// replacement animation JSON (e.g. under public/animations/) rather than
// depend on someone else's asset CDN not rotating URLs.
const ANIMATIONS = {
  confetti: "https://assets5.lottiefiles.com/packages/lf20_rcwhirwa.json",
  trophy: "https://assets3.lottiefiles.com/packages/lf20_touohxv0.json",
  checkmark: "https://assets10.lottiefiles.com/packages/lf20_jbrw3hcz.json",
  coins: "https://assets1.lottiefiles.com/packages/lf20_tno6cg2w.json",
};

/**
 * @param {{ type?: string, show?: boolean, onComplete?: () => void, message?: string }} props
 */
export function CelebrationOverlay({ type = "confetti", show, onComplete, message }) {
  const { t } = useTranslation();
  const overlayRef = useRef(null);

  useEffect(() => {
    if (show) overlayRef.current?.focus();
  }, [show]);

  if (!show) return null;

  return (
    <div
      ref={overlayRef}
      className="ed-celebration-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={message || t("celebration.defaultTitle")}
      tabIndex={-1}
      onClick={onComplete}
      onKeyDown={(e) => e.key === "Escape" && onComplete?.()}
    >
      <Suspense fallback={null}>
        <LottiePlayer
          autoplay
          keepLastFrame={false}
          src={ANIMATIONS[type] || ANIMATIONS.confetti}
          style={{ width: 280, height: 280 }}
          onEvent={(e) => {
            if (e === "complete") onComplete?.();
          }}
        />
      </Suspense>
      {message ? <div className="ed-display-sm">{message}</div> : null}
      <div className="ed-caption">{t("celebration.tapToContinue")}</div>
    </div>
  );
}
