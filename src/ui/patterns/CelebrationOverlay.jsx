import { Player } from "@lottiefiles/react-lottie-player";
import { useTranslation } from "../../i18n/I18nProvider.js";

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
  if (!show) return null;

  return (
    <div
      className="ct-celebration-overlay"
      role="dialog"
      aria-label={message || t("celebration.defaultTitle")}
      onClick={onComplete}
      onKeyDown={(e) => e.key === "Escape" && onComplete?.()}
    >
      <Player
        autoplay
        keepLastFrame={false}
        src={ANIMATIONS[type] || ANIMATIONS.confetti}
        style={{ width: 280, height: 280 }}
        onEvent={(e) => {
          if (e === "complete") onComplete?.();
        }}
      />
      {message ? <div className="ct-celebration-message">{message}</div> : null}
      <div className="ct-celebration-hint">{t("celebration.tapToContinue")}</div>
    </div>
  );
}
