export const COLOR_SCHEME_IDS = ["light", "dark", "system"];

export function resolveColorScheme(preference) {
  const pref = COLOR_SCHEME_IDS.includes(preference) ? preference : "dark";
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyColorScheme(preference) {
  if (typeof document === "undefined") return "light";
  const resolved = resolveColorScheme(preference);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "dark" ? "#0d0d17" : "#eef1f8");
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
        return applyColorScheme(o.colorScheme || "dark");
      }
    }
  } catch {
    /* ignore */
  }
  return applyColorScheme("dark");
}
