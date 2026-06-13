import en from "./messages/en.js";
import { DEFAULT_LANGUAGE, normalizeAppLanguage } from "./languages.js";

/** @type {Record<string, Record<string, string>>} */
const cache = { [DEFAULT_LANGUAGE]: en };

/** @type {Record<string, () => Promise<{ default: Record<string, string> }>>} */
const LOADERS = {
  as: () => import("./messages/as.js"),
  bn: () => import("./messages/bn.js"),
  brx: () => import("./messages/brx.js"),
  doi: () => import("./messages/doi.js"),
  gu: () => import("./messages/gu.js"),
  hi: () => import("./messages/hi.js"),
  kn: () => import("./messages/kn.js"),
  ks: () => import("./messages/ks.js"),
  kok: () => import("./messages/kok.js"),
  mai: () => import("./messages/mai.js"),
  ml: () => import("./messages/ml.js"),
  mni: () => import("./messages/mni.js"),
  mr: () => import("./messages/mr.js"),
  ne: () => import("./messages/ne.js"),
  or: () => import("./messages/or.js"),
  pa: () => import("./messages/pa.js"),
  sa: () => import("./messages/sa.js"),
  sat: () => import("./messages/sat.js"),
  sd: () => import("./messages/sd.js"),
  ta: () => import("./messages/ta.js"),
  te: () => import("./messages/te.js"),
  ur: () => import("./messages/ur.js"),
};

/** @returns {string[]} */
export function listMessageKeys() {
  return Object.keys(en);
}

/**
 * @param {string} locale
 * @returns {Promise<Record<string, string>>}
 */
export async function loadMessages(locale) {
  const code = normalizeAppLanguage(locale);
  if (code === DEFAULT_LANGUAGE) return en;
  if (cache[code]) return cache[code];
  const loader = LOADERS[code];
  if (!loader) return en;
  const mod = await loader();
  const merged = { ...en, ...mod.default };
  cache[code] = merged;
  return merged;
}

export function invalidateMessageCache(locale) {
  const code = normalizeAppLanguage(locale);
  if (code !== DEFAULT_LANGUAGE) delete cache[code];
}

/**
 * @param {Record<string, string>} messages
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 */
export function translate(messages, key, params = {}) {
  let text = messages[key] ?? en[key] ?? key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return text;
}

/**
 * @param {string} locale
 * @param {Record<string, string>} messages
 */
export function validateLocaleMessages(locale, messages) {
  const missing = listMessageKeys().filter((k) => messages[k] === undefined);
  return { locale, missing, complete: missing.length === 0 };
}

export { en as enMessages };
