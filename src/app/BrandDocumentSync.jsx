import { useEffect } from "react";
import { useTranslation } from "../i18n/I18nProvider.js";
import { useResolvedTheme } from "../hooks/useResolvedTheme.js";
import { brandIconForTheme } from "../ui/brand/brandAssets.js";
import { assetUrl } from "../utils/basePath.js";

/**
 * @param {string} rel
 * @param {{ href: string, type?: string }} opts
 */
function upsertLink(rel, { href, type }) {
  /** @type {HTMLLinkElement | null} */
  let el = /** @type {HTMLLinkElement | null} */ (document.querySelector(`link[rel="${rel}"]`));
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  if (type) el.type = type;
}

/** Tab title + favicon follow Perovo brand assets and theme. */
export default function BrandDocumentSync() {
  const { t } = useTranslation();
  const theme = useResolvedTheme();

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = t("brand.appName");

    const tabIcon = assetUrl(`brand/${brandIconForTheme(theme)}`);
    upsertLink("icon", { href: tabIcon, type: "image/svg+xml" });
    upsertLink("apple-touch-icon", {
      href: assetUrl(theme === "light" ? "pwa-192-light.svg" : "pwa-192.svg"),
    });

    const metaTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (metaTitle) metaTitle.setAttribute("content", t("brand.appName"));
  }, [t, theme]);

  return null;
}
