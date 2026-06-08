import { useMemo } from "react";
import { COPY } from "../constants/copy.js";
import { useTranslation } from "./I18nProvider.js";

/** @returns {Record<keyof typeof COPY, string>} */
export function useCopy() {
  const { t } = useTranslation();
  return useMemo(() => {
    /** @type {Record<string, string>} */
    const out = {};
    for (const [id, key] of Object.entries(COPY)) {
      out[id] = t(key);
    }
    return out;
  }, [t]);
}
