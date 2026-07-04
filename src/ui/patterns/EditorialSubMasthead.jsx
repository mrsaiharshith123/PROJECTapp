import { useTranslationOptional } from "../../i18n/I18nProvider.js";

/**
 * Editorial sub-page header — same band, thick rule, and vertical centering as Home.
 * @param {{
 *   title: string,
 *   tagline?: string,
 *   onBack?: () => void,
 *   backLabel?: string,
 *   right?: import('react').ReactNode,
 * }} props
 */
export default function EditorialSubMasthead({ title, tagline, onBack, backLabel, right }) {
  const { t } = useTranslationOptional();
  const backText = backLabel ?? t("common.backArrow");

  return (
    <header className="ed-masthead ed-masthead--sub">
      <div className={`ed-masthead-top ed-masthead-top--sub${onBack ? "" : " ed-masthead-top--sub-no-back"}`}>
        {onBack ? (
          <button type="button" className="ed-masthead-back" onClick={onBack} aria-label={t("common.back")}>
            {backText}
          </button>
        ) : null}
        <div className="ed-masthead-brand">
          <h1 className="ed-title">{title}</h1>
          {tagline ? <p className="ed-tagline">{tagline}</p> : null}
        </div>
        {right ? <div className="ed-masthead-right">{right}</div> : null}
      </div>
    </header>
  );
}
