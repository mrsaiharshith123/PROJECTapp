import { createContext, useCallback, useContext, useMemo } from "react";

/** @typedef {{ locale: string, t: (key: string, params?: Record<string, string | number>) => string, ready: boolean }} UpdateTestI18nValue */

/** @type {import('react').Context<UpdateTestI18nValue | null>} */
export const UpdateTestI18nContext = createContext(null);

/**
 * @param {Record<string, string>} messages
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 */
function translate(messages, key, params = {}) {
  let text = messages[key] ?? key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return text;
}

/**
 * @param {{ children: import('react').ReactNode, messages: Record<string, string> }} props
 */
export function UpdateTestShellI18n({ children, messages }) {
  const t = useCallback((key, params) => translate(messages, key, params), [messages]);
  const value = useMemo(() => ({ locale: "en", t, ready: true }), [t]);
  return <UpdateTestI18nContext.Provider value={value}>{children}</UpdateTestI18nContext.Provider>;
}

/** @returns {UpdateTestI18nValue} */
export function useUpdateTestTranslation() {
  const ctx = useContext(UpdateTestI18nContext);
  if (!ctx) {
    throw new Error("useUpdateTestTranslation must be used within UpdateTestShellI18n");
  }
  return ctx;
}
