import { useState } from "react";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { applyColorScheme } from "../../../../utils/theme.js";
import { ALL_APP_LANGUAGES } from "../../../../i18n/languages.js";
import YouSubPageShell from "./YouSubPageShell.jsx";

/** Theme and app language. */
export default function YouAppearancePage() {
  const { t, locale } = useTranslation();
  const { settings, updateSettings } = usePerovo();
  const [langFlash, setLangFlash] = useState(false);

  const onSelectLang = (code) => {
    if (code === locale) return;
    updateSettings({ appLanguage: code });
    setLangFlash(true);
    window.setTimeout(() => setLangFlash(false), 2000);
  };

  const themes = [
    { id: "light", label: t("appearance.light") },
    { id: "dark", label: t("appearance.dark") },
    { id: "amoled", label: t("appearance.amoled") },
    { id: "system", label: t("appearance.system") },
  ];

  return (
    <YouSubPageShell titleKey="settings.row.appearance">
      <div className="ed-you-section">
        <div className="ed-ins-kicker">{t("profile.appearance")}</div>
        <div className="ed-option-row">
          {themes.map((opt) => {
            const active = (settings.colorScheme || "light") === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`ed-option-btn ${active ? "active" : ""}`}
                onClick={() => {
                  updateSettings({ colorScheme: opt.id });
                  applyColorScheme(opt.id);
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="ed-you-field-hint" style={{ marginTop: 8 }}>
          {t("profile.themeHint")}
        </div>
      </div>

      <div className="ed-you-section" style={{ borderBottom: "none" }}>
        <div className="ed-ins-kicker">{t("profile.language")}</div>
        {langFlash ? (
          <div className="ed-you-note" style={{ marginBottom: 8 }}>
            {t("profile.languageSaved")}
          </div>
        ) : null}
        <div className="ed-lang-grid">
          {ALL_APP_LANGUAGES.map((lang) => {
            const active = locale === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                className={`ed-lang-btn ${active ? "active" : ""}`}
                onClick={() => onSelectLang(lang.code)}
              >
                <span className="ed-lang-btn-native">{lang.nativeName}</span>
                <span className="ed-lang-btn-english">{lang.englishName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </YouSubPageShell>
  );
}
