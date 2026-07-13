import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePerovo } from "../context/PerovoContext.jsx";
import { forceThemeRepaint } from "../utils/theme.js";

/** Reset scroll on route changes + force a browser repaint (see forceThemeRepaint). */
export default function ScrollToTop() {
  const { pathname, key } = useLocation();
  const { settings } = usePerovo();
  const preference = settings.colorScheme || "light";

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector(".ed-main")?.scrollTo?.(0, 0);
    forceThemeRepaint(preference);
  }, [pathname, key, preference]);

  return null;
}
