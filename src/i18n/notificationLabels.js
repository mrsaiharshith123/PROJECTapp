import { translateInsight } from "./insightLabels.js";

/**
 * Resolve in-app / OS notification copy from i18n keys.
 * @param {(key: string, params?: object) => string} t
 * @param {object} n
 */
export function translateNotification(t, n) {
  if (!n) return { title: "", message: "" };

  const title = n.titleKey ? t(n.titleKey, n.titleParams || {}) : n.title || "";

  const message = (() => {
    if (n.messageKey) {
      let text = t(n.messageKey, n.messageParams || {});
      if (n.suffixKey) text += t(n.suffixKey, n.suffixParams || {});
      return text;
    }
    if (n.insightId) return translateInsight(t, { id: n.insightId, params: n.insightParams });
    return n.message || "";
  })();

  let osBody = n.osBody || "";
  if (n.osBodyKey) osBody = t(n.osBodyKey, n.osBodyParams || {});

  return { title, message: message || osBody, osBody };
}
