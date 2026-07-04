import { useTranslation } from "../../i18n/I18nProvider.js";
import { useSharePerovoScore } from "../../hooks/useSharePerovoScore.js";
import { CtIcon } from "../icons/CtIcon.jsx";

/**
 * Icon-only control to share Perovo score as image + link.
 * @param {{ className?: string, size?: number }} props
 */
export function ShareScoreIconButton({ className = "", size = 18 }) {
  const { t } = useTranslation();
  const { shareScore, sharing } = useSharePerovoScore();

  return (
    <button
      type="button"
      className={`ed-btn ed-btn-ghost ${className}`.trim()}
      onClick={(e) => {
        e.stopPropagation();
        shareScore();
      }}
      disabled={sharing}
      aria-label={t("scoreDetail.shareScore")}
    >
      <CtIcon name="share-network" size={size} />
    </button>
  );
}

export default ShareScoreIconButton;
