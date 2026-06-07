import { useState } from "react";
import { ALL_APP_LANGUAGES } from "../../../i18n/languages.js";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";
import { Caption, Heading } from "../../index.js";

/**
 * @param {{ updateSettings: (patch: object) => void }} props
 */
export default function ProfileLanguageSection({ updateSettings }) {
  const { t, locale } = useTranslation();
  const [savedFlash, setSavedFlash] = useState(false);

  const onSelect = (code) => {
    if (code === locale) return;
    updateSettings({ appLanguage: code });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className="ct-stack">
      <div>
        <Heading level={3}>{t("profile.language")}</Heading>
        <Caption className="block mt-1">{t("profile.languageHint")}</Caption>
      </div>
      <div className="ct-grid-2">
        {ALL_APP_LANGUAGES.map((lang) => {
          const active = locale === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onSelect(lang.code)}
              className={`ct-option-card !py-3 !text-left ${active ? "ct-option-card-active" : ""}`}
              aria-pressed={active}
            >
              <span className="block text-sm font-semibold text-[var(--ct-text)]">{lang.nativeName}</span>
              <span className="block text-xs text-[var(--ct-text-muted)] mt-0.5">{lang.englishName}</span>
            </button>
          );
        })}
      </div>
      {savedFlash && (
        <Caption className="text-[var(--ct-success)] font-semibold">{t("profile.languageSaved")}</Caption>
      )}
    </div>
  );
}
