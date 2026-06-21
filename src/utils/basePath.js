/** Vite `base` without trailing slash (for React Router `basename`). */
export function routerBasename() {
  const base = import.meta.env.BASE_URL || "/";
  if (base === "/" || base === "./") return undefined;
  return base.replace(/\/$/, "");
}

/** Prefix a public asset path with the deploy base (e.g. /PROJECTapp/). */
export function assetUrl(path) {
  const base = import.meta.env.BASE_URL || "/";
  const clean = String(path).replace(/^\//, "");
  if (base === "./") return `./${clean}`;
  return `${base}${clean}`;
}
