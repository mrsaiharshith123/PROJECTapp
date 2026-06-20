import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePerovo } from "../../context/PerovoContext.jsx";
import { loadSettingsFromStorage } from "../../utils/migrateStorage.js";
import { getLanguageMeta, isRtlLanguage, normalizeAppLanguage } from "../../i18n/languages.js";
import { enMessages, loadMessages, translate, invalidateMessageCache } from "../../i18n/translate.js";

/** @typedef {{ locale: string, meta: import('../../i18n/languages.js').AppLanguage, t: (key: string, params?: Record<string, string | number>) => string, ready: boolean }} I18nContextValue */

/** @type {import('react').Context<I18nContextValue | null>} */
const I18nContext = createContext(null);

function localeFromStorage() {
  return normalizeAppLanguage(loadSettingsFromStorage()?.appLanguage);
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

function I18nProviderWithPerovo({ children }) {
  const { settings } = usePerovo();
  const locale = normalizeAppLanguage(settings.appLanguage);
  return <I18nProviderCore locale={locale}>{children}</I18nProviderCore>;
}

/**
 * @param {{ children: import('react').ReactNode, standalone?: boolean }} props
 * standalone — landing page without PerovoProvider (language from local storage)
 */
export function I18nProvider({ children, standalone = false }) {
  if (standalone) {
    return <I18nProviderCore locale={localeFromStorage()}>{children}</I18nProviderCore>;
  }
  return <I18nProviderWithPerovo>{children}</I18nProviderWithPerovo>;
}

/** @returns {I18nContextValue} */
// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return ctx;
}
