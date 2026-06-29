import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadSettingsFromStorage } from "../../utils/migrateStorage.js";
import { getLanguageMeta, isRtlLanguage, normalizeAppLanguage } from "../../i18n/languages.js";
import { enMessages, loadMessages, translate, invalidateMessageCache } from "../../i18n/translate.js";
import { usePerovo } from "../../context/PerovoContext.jsx";

/** @typedef {{ locale: string, meta: import('../../i18n/languages.js').AppLanguage, t: (key: string, params?: Record<string, string | number>) => string, ready: boolean }} I18nContextValue */

/** @type {import('react').Context<I18nContextValue | null>} */
const I18nContext = createContext(null);

/** @type {import('react').Context<{ setLocale: (locale: string) => void } | null>} */
const LocaleControlContext = createContext(null);

function localeFromStorage() {
  return normalizeAppLanguage(loadSettingsFromStorage()?.appLanguage);
}

function fallbackTranslation() {
  return {
    locale: "en",
    meta: getLanguageMeta("en"),
    t: (key, params) => translate(enMessages, key, params),
    ready: true,
  };
}

function I18nProviderCore({ children, locale }) {
  const [messages, setMessages] = useState(null);

  useEffect(() => {
    invalidateMessageCache(locale);
    let cancelled = false;
    loadMessages(locale).then((m) => {
      if (!cancelled) setMessages(m);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    const meta = getLanguageMeta(locale);
    document.documentElement.lang = locale === "en" ? "en-IN" : locale;
    document.documentElement.dir = isRtlLanguage(locale) ? "rtl" : "ltr";
    document.documentElement.dataset.locale = locale;
    document.documentElement.dataset.script = meta.script;
  }, [locale]);

  const t = useCallback(
    (key, params) => {
      if (!messages) return translate(enMessages, key, params);
      return translate(messages, key, params);
    },
    [messages],
  );

  const value = useMemo(
    () => ({
      locale,
      meta: getLanguageMeta(locale),
      t,
      ready: Boolean(messages),
    }),
    [locale, t, messages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Sync locale when Perovo settings change — mount inside PerovoProvider.
 */
export function PerovoLocaleSync() {
  const { settings } = usePerovo();
  const control = useContext(LocaleControlContext);

  useEffect(() => {
    if (!control?.setLocale) return;
    control.setLocale(normalizeAppLanguage(settings.appLanguage));
  }, [settings.appLanguage, control]);

  return null;
}

/**
 * @param {{ children: import('react').ReactNode, standalone?: boolean }} props
 * standalone — landing page without PerovoProvider (language from local storage only)
 */
export function I18nProvider({ children, standalone = false }) {
  const [locale, setLocale] = useState(localeFromStorage);
  const control = useMemo(() => ({ setLocale }), []);

  return (
    <LocaleControlContext.Provider value={standalone ? null : control}>
      <I18nProviderCore locale={locale}>{children}</I18nProviderCore>
    </LocaleControlContext.Provider>
  );
}

/** @returns {I18nContextValue} */
// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    if (import.meta.env.DEV) {
      console.warn("useTranslation: missing I18nProvider — using English fallback");
    }
    return fallbackTranslation();
  }
  return ctx;
}

/** @deprecated use useTranslation — kept for explicit boot-safe call sites */
// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useTranslationOptional() {
  return useTranslation();
}
