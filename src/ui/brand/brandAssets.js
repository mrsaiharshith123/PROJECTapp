/** Canonical Perovo brand files — only these four exist under public/brand/. */
export const BRAND_ICON = {
  light: "icon-light.png",
  dark: "icon-dark.png",
};

export const BRAND_WORDMARK = {
  light: "wordmark-light.png",
  dark: "wordmark-dark.png",
};

export function brandIconForTheme(theme) {
  return theme === "dark" ? BRAND_ICON.dark : BRAND_ICON.light;
}

export function brandWordmarkForTheme(theme) {
  return theme === "dark" ? BRAND_WORDMARK.dark : BRAND_WORDMARK.light;
}
