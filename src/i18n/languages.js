/**
 * 22 scheduled languages of India + English (default / fallback).
 * @typedef {{ code: string, englishName: string, nativeName: string, script: string, rtl?: boolean }} AppLanguage
 */

/** @type {AppLanguage[]} */
export const INDIAN_LANGUAGES = [
  { code: "as", englishName: "Assamese", nativeName: "অসমীয়া", script: "Bengali" },
  { code: "bn", englishName: "Bengali", nativeName: "বাংলা", script: "Bengali" },
  { code: "brx", englishName: "Bodo", nativeName: "बड़ो", script: "Devanagari" },
  { code: "doi", englishName: "Dogri", nativeName: "डोगरी", script: "Devanagari" },
  { code: "gu", englishName: "Gujarati", nativeName: "ગુજરાતી", script: "Gujarati" },
  { code: "hi", englishName: "Hindi", nativeName: "हिन्दी", script: "Devanagari" },
  { code: "kn", englishName: "Kannada", nativeName: "ಕನ್ನಡ", script: "Kannada" },
  { code: "ks", englishName: "Kashmiri", nativeName: "کٲشُر", script: "Arabic" },
  { code: "kok", englishName: "Konkani", nativeName: "कोंकणी", script: "Devanagari" },
  { code: "mai", englishName: "Maithili", nativeName: "मैथिली", script: "Devanagari" },
  { code: "ml", englishName: "Malayalam", nativeName: "മലയാളം", script: "Malayalam" },
  { code: "mni", englishName: "Manipuri", nativeName: "মৈতৈলোন্", script: "Bengali" },
  { code: "mr", englishName: "Marathi", nativeName: "मराठी", script: "Devanagari" },
  { code: "ne", englishName: "Nepali", nativeName: "नेपाली", script: "Devanagari" },
  { code: "or", englishName: "Odia", nativeName: "ଓଡ଼ିଆ", script: "Odia" },
  { code: "pa", englishName: "Punjabi", nativeName: "ਪੰਜਾਬੀ", script: "Gurmukhi" },
  { code: "sa", englishName: "Sanskrit", nativeName: "संस्कृतम्", script: "Devanagari" },
  { code: "sat", englishName: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", script: "Ol Chiki" },
  { code: "sd", englishName: "Sindhi", nativeName: "سنڌي", script: "Arabic" },
  { code: "ta", englishName: "Tamil", nativeName: "தமிழ்", script: "Tamil" },
  { code: "te", englishName: "Telugu", nativeName: "తెలుగు", script: "Telugu" },
  { code: "ur", englishName: "Urdu", nativeName: "اردو", script: "Arabic", rtl: true },
];

export const DEFAULT_LANGUAGE = "en";

/** @type {AppLanguage} */
export const ENGLISH_LANGUAGE = {
  code: "en",
  englishName: "English",
  nativeName: "English",
  script: "Latin",
};

/** @type {AppLanguage[]} */
export const ALL_APP_LANGUAGES = [ENGLISH_LANGUAGE, ...INDIAN_LANGUAGES];

const CODE_SET = new Set(ALL_APP_LANGUAGES.map((l) => l.code));

/** @param {string} [code] */
export function normalizeAppLanguage(code) {
  const c = String(code || DEFAULT_LANGUAGE).trim().toLowerCase();
  return CODE_SET.has(c) ? c : DEFAULT_LANGUAGE;
}

/** @param {string} code */
export function getLanguageMeta(code) {
  const c = normalizeAppLanguage(code);
  return ALL_APP_LANGUAGES.find((l) => l.code === c) || ENGLISH_LANGUAGE;
}

/** @param {string} code */
export function isRtlLanguage(code) {
  return Boolean(getLanguageMeta(code).rtl);
}
