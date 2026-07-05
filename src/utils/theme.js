export const COLOR_SCHEME_IDS = ["light", "dark", "amoled", "system"];

export function resolveColorScheme(preference) {
  const pref = COLOR_SCHEME_IDS.includes(preference) ? preference : "light";
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  if (pref === "amoled") return "amoled";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

const THEME_COLOR = {
  light: "#faf8f3",
  dark: "#16140f",
  amoled: "#000000",
};

export function applyColorScheme(preference) {
  if (typeof document === "undefined") return "light";
  const resolved = resolveColorScheme(preference);
  const root = document.documentElement;
  if (resolved === "dark") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = resolved;
  }
  root.classList.toggle("dark", resolved === "dark" || resolved === "amoled");
  root.style.colorScheme = resolved === "amoled" ? "dark" : resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEME_COLOR[resolved] || THEME_COLOR.dark);
  }
  return resolved;
}

/** Apply theme before React mounts (avoids flash). */
export function bootstrapThemeFromStorage() {
  try {
    const raw = localStorage.getItem("perovo_settings");
    if (raw) {
      const o = JSON.parse(raw);
      if (o && typeof o === "object" && !Array.isArray(o)) {
        return applyColorScheme(o.colorScheme || "light");
      }
    }
  } catch {
    /* ignore */
  }
  return applyColorScheme("light");
}
